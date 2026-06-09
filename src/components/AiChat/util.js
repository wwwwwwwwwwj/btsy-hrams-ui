import { ref, computed, onBeforeUnmount, nextTick } from 'vue';
import { uuid, toTree, findTree, eachTree, omit } from 'ele-admin-plus';
import { TOKEN_HEADER_NAME } from '@/config/setting';
import { getToken } from '@/utils/token-util';
import { isImageUrl } from '@/utils/common';
import { chatApiUrl, defaultModel } from './config';

/**
 * AI 对话补全接口调用封装
 * @param option 参数
 */
export function useAiSdk(option) {
  let abortController = null;

  /** 异步对话补全 */
  const chatCompletion = async (param, callback) => {
    try {
      let fullContent = '';
      let fullReasoning = null;
      abortController = new AbortController();
      const requestBody = {
        ...(option?.params || {}),
        ...param,
        stream: true
      };
      if (requestBody.model == null) {
        requestBody.model = defaultModel;
      }
      const systemMessages =
        typeof option?.systemMessages === 'function'
          ? option.systemMessages()
          : option?.systemMessages;
      requestBody.messages = [
        ...(systemMessages || []),
        ...(requestBody.messages || [])
      ];
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...((typeof option?.headers === 'function'
          ? option.headers()
          : option?.headers) || {})
      };
      const baseURL =
        typeof option?.baseURL === 'function'
          ? option.baseURL()
          : option?.baseURL;
      const response = await fetch(`${baseURL ?? ''}${chatApiUrl}`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });
      if (!response.ok || !response.body) {
        const errorData = await response.json();
        const eMsg = errorData?.error?.message;
        throw new Error(eMsg ?? `${response.status}: ${response.statusText}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          callback?.onComplete && callback.onComplete();
          return;
        }
        const lines = decoder
          .decode(value, {
            stream: true
          })
          .split('\n');
        for (const line of lines) {
          if (line.trim() === '') {
            continue;
          }
          if (line === 'data: [DONE]') {
            callback?.onComplete && callback.onComplete();
            return;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error != null) {
                callback?.onError && callback.onError(data.error);
                return;
              }
              const delta = (data.choices || [])[0]?.delta || {};
              const chunk_reasoning =
                delta.reasoning_content ?? delta.reasoning;
              fullContent += delta.content ?? '';
              if (chunk_reasoning != null) {
                fullReasoning = (fullReasoning ?? '') + chunk_reasoning;
              }
              const item = {
                message_id: data.message_id ?? data.id,
                parent_message_id: data.parent_message_id,
                ...delta,
                content: fullContent,
                reasoning: fullReasoning == null ? null : fullReasoning.trim(),
                chunk_content: delta.content,
                chunk_reasoning: chunk_reasoning,
                is_reasoning: chunk_reasoning != null
              };
              callback?.onChunk && callback.onChunk(item);
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        callback?.onError && callback.onError(e);
      }
    } finally {
      abortController = null;
    }
  };

  /** 中止异步对话补全 */
  const stopChatCompletion = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };

  return {
    chatCompletion,
    stopChatCompletion
  };
}

/**
 * 处理消息数据, 有多个合并消息时只显示选中的消息
 * @param data 树结构的消息数据
 */
function getActiveMessages(data) {
  const items = [];
  if (data?.length) {
    const i = data.findIndex((item) => item.active);
    const index = i === -1 ? data.length - 1 : i;
    const item = data[index];
    items.push({
      ...item,
      children: void 0
    });
    getActiveMessages(item.children).forEach((child) => {
      items.push(child);
    });
  }
  return items;
}

/**
 * 组装上下文消息
 * @param activeMessages 展示的消息列表
 * @param breakMessageId 重新生成回复消息时截止的消息 id
 * @param tempMessageId 新发送或编辑重新发送用户消息时前端临时生成的消息 id
 */
function getContextMessages(activeMessages, breakMessageId, tempMessageId) {
  const contextMessages = [];
  for (const item of activeMessages) {
    if (breakMessageId != null && item.messageId === breakMessageId) {
      break;
    }
    const stop = tempMessageId != null && item.messageId === tempMessageId;
    const itemMessageId = stop ? void 0 : item.messageId;
    let contents;
    if (item.files?.length) {
      contents = [
        {
          type: 'text',
          text: item.content
        }
      ];
      for (let i = 0; i < item.files.length; i++) {
        const file = item.files[i];
        if (file.url) {
          if (isImageUrl(file.name)) {
            contents.push({
              type: 'image_url',
              image_url: {
                url: file.url
              }
            });
          } else {
            contents.push({
              type: 'file_url',
              file_url: {
                url: file.url
              }
            });
          }
        } else {
          contents.push({
            type: 'text',
            text: `\n<ATTACHMENT_FILE>\n<FILE_INDEX>${i + 1}</FILE_INDEX>\n<FILE_NAME>${file.name}</FILE_NAME>\n<FILE_KEY>file:${file.name}-${file.key}</FILE_KEY>\n<FILE_LINES></FILE_LINES>\n<FILE_SIZE>${file.file?.size} bytes</FILE_SIZE>\n<FILE_CONTENT>\n</FILE_CONTENT>\n</ATTACHMENT_FILE>\n`
          });
        }
      }
    }
    contextMessages.push({
      role: item.role,
      content: contents ? contents : item.content,
      message_id: itemMessageId,
      parent_message_id: item.parentMessageId
    });
    if (stop) {
      break;
    }
  }
  return contextMessages;
}

/**
 * 对话管理及消息数据操作封装
 * @param option 参数
 */
export function useAiChat(option) {
  const { chatCompletion, stopChatCompletion } = useAiSdk({
    baseURL: import.meta.env.VITE_API_URL,
    headers: () => {
      const headers = {};
      const token = getToken();
      if (token) {
        headers[TOKEN_HEADER_NAME] = `Bearer ${token}`;
      }
      return headers;
    },
    ...(option?.aiSdkOption || {})
  });

  /** 对话列表 */
  const conversations = ref([]);

  /** 对话列表选中 */
  const selectedConversationKey = ref();

  /** 是否是消息接收中 */
  const isReceiving = ref(false);

  /** 全部的消息列表(树结构) */
  const messageList = ref([]);

  /** 展示的消息列表 */
  const messages = computed(() => {
    return getActiveMessages(messageList.value);
  });

  /** 处理消息格式 */
  const formatMessage = (item) => {
    item.key = item.messageId;
    // 增加名称和头像
    if (item.role === 'user') {
      item.placement = 'end'; // 设置消息气泡为右侧位置
      item.header = option?.userName;
      item.avatar = option?.userAvatar;
    } else if (item.role === 'assistant') {
      item.header = option?.aiName;
      item.avatar = option?.aiAvatar;
    }
  };

  /** 遍历消息 */
  const eachMessages = (callback) => {
    eachTree(messageList.value, callback);
  };

  /** 根据条件查找消息 */
  const findMessage = (p) => {
    return findTree(messageList.value, p);
  };

  /** 根据 id 获取消息 */
  const getMessage = (messageId) => {
    if (messageId == null) {
      return;
    }
    return findMessage((item) => item.messageId === messageId);
  };

  /** 有多个合并消息时增加总数和索引 */
  const updateMessageCount = (list) => {
    if (!list) {
      return;
    }
    const messageCount = list.length;
    list.forEach((item, index) => {
      item.messageIndex = index;
      item.messageCount = messageCount;
    });
  };

  /** 添加消息数据 */
  const addMessage = (data) => {
    formatMessage(data);
    const parentId = data.parentMessageId;
    const parent = parentId == null ? void 0 : getMessage(parentId);
    if (!parent) {
      messageList.value.push(data);
      updateMessageCount(messageList.value);
      return;
    }
    if (!parent.children) {
      parent.children = [data];
      return;
    }
    parent.children.push(data);
    updateMessageCount(parent.children);
  };

  /** 修改消息字段值 */
  const setMessage = (messageId, prop, value) => {
    const item = getMessage(messageId);
    if (item && item[prop] !== value) {
      item[prop] = value;
    }
  };

  /** 设置消息数据并处理数据格式 */
  const setMessages = (data) => {
    const treeData = toTree({
      data,
      idField: 'messageId',
      parentIdField: 'parentMessageId',
      afterFormatter: (item) => {
        formatMessage(item);
        updateMessageCount(item.children);
        // 附件图片类型加 imageUrl 字段以支持预览
        if (item.files?.length) {
          item.files = item.files.map((file) => ({
            ...file,
            imageUrl: isImageUrl(file.name) ? file.url : void 0
          }));
        }
        return item;
      }
    });
    updateMessageCount(treeData);
    messageList.value = treeData;
  };

  /** 修改对话字段值 */
  const setConversation = (conversationId, prop, value) => {
    const item = conversations.value.find(
      (d) => d.conversationId === conversationId
    );
    if (item && item[prop] !== value) {
      item[prop] = value;
      if (prop === 'isPinned') {
        item.pinTime = Date.now();
      }
    }
  };

  /** 设置对话列表 */
  const setConversations = (data) => {
    conversations.value = data.map((item) => ({
      ...item,
      key: item.conversationId
    }));
  };

  /** 删除对话 */
  const removeConversation = (conversationId) => {
    if (conversationId == null) {
      return;
    }
    const index = conversations.value.findIndex(
      (d) => d.conversationId === conversationId
    );
    if (selectedConversationKey.value === conversations.value[index].key) {
      selectedConversationKey.value = void 0;
      // 清空消息列表
      stopReceiving();
      setMessages([]);
    }
    if (index !== -1) {
      conversations.value.splice(index, 1);
    }
  };

  /**
   * 开始接收回复消息
   * @param param 请求参数
   * @param userMessageId 用户消息 id
   * @param conversationId 对话 id
   */
  const startChatCompletion = (param, userMessageId, conversationId) => {
    // 添加回复消息
    const aiMessageId = uuid();
    addMessage({
      messageId: aiMessageId,
      parentMessageId: userMessageId,
      conversationId,
      active: true,
      role: 'assistant',
      status: 'loading'
    });
    const aiMessageItem = getMessage(aiMessageId);
    if (!aiMessageItem) {
      return;
    }
    if (option?.scrollContent) {
      nextTick(() => {
        option?.scrollContent && option.scrollContent('bottom');
      });
    }
    const userMessageItem =
      userMessageId == null ? void 0 : getMessage(userMessageId);
    // 接收数据流更新回复消息
    chatCompletion(param, {
      onChunk: (message) => {
        aiMessageItem.reasoning = message.reasoning;
        aiMessageItem.content = message.content;
        aiMessageItem.status = message.is_reasoning ? 'thinking' : 'receiving';
        // id 更新为后端的值
        const { message_id, parent_message_id, conversation_id } = message;
        if (message_id != null && aiMessageItem.messageId !== message_id) {
          aiMessageItem.messageId = message_id;
        }
        if (
          parent_message_id != null &&
          aiMessageItem.parentMessageId !== parent_message_id
        ) {
          aiMessageItem.parentMessageId = parent_message_id;
          if (userMessageItem != null) {
            userMessageItem.messageId = parent_message_id;
          }
        }
        if (
          conversation_id != null &&
          aiMessageItem.conversationId !== conversation_id
        ) {
          setConversation(
            aiMessageItem.conversationId,
            'conversationId',
            conversation_id
          );
          aiMessageItem.conversationId = conversation_id;
          if (userMessageItem != null) {
            userMessageItem.conversationId = conversation_id;
          }
        }
        // 内容区滚动的底部
        if (option?.scrollContent) {
          nextTick(() => {
            option?.scrollContent && option.scrollContent('bottom');
          });
        }
      },
      onComplete: () => {
        aiMessageItem.status = 'finish';
        isReceiving.value = false;
      },
      onError: (e) => {
        aiMessageItem.status = 'finish';
        isReceiving.value = false;
        if (aiMessageItem.content == null) {
          aiMessageItem.content = `❌ ${e.message ?? ''}`;
        }
        if (option?.scrollContent) {
          nextTick(() => {
            option?.scrollContent && option.scrollContent('bottom');
          });
        }
        console.error(e);
      }
    });
  };

  /** 发送消息 */
  const sendMessage = (param) => {
    if (isReceiving.value) {
      return;
    }
    eachMessages((msgItem) => {
      msgItem.editStatus = false;
    });
    isReceiving.value = true;
    const parent_message_id =
      messages.value[messages.value.length - 1]?.messageId;
    // 新对话时添加对话
    let conversation_id;
    let userMessageConversationId;
    if (selectedConversationKey.value == null) {
      const conversationId = uuid();
      conversations.value.unshift({
        conversationId,
        key: conversationId,
        label: (param.content ?? '').slice(0, 33)
      });
      selectedConversationKey.value = conversationId;
      userMessageConversationId = conversationId;
    } else {
      const conversation = conversations.value.find(
        (d) => d.key === selectedConversationKey.value
      );
      conversation_id = conversation?.conversationId;
      userMessageConversationId = conversation_id;
    }
    // 添加用户消息
    const userMessageId = uuid();
    addMessage({
      messageId: userMessageId,
      parentMessageId: parent_message_id,
      conversationId: userMessageConversationId,
      active: true,
      content: param.content,
      role: 'user',
      files: param.files
    });
    if (option?.scrollContent) {
      nextTick(() => {
        option?.scrollContent && option.scrollContent('bottom');
      });
    }
    // 接收回复消息
    const contexts = getContextMessages(messages.value, void 0, userMessageId);
    startChatCompletion(
      {
        ...omit(param, ['content', 'files', 'message']),
        messages: contexts,
        conversation_id,
        parent_message_id,
        regenerate: false,
        regenerate_message_id: void 0
      },
      userMessageId,
      userMessageConversationId
    );
  };

  /** 重新编辑并发送消息 */
  const resendMessage = (param) => {
    if (!param.message) {
      return;
    }
    if (isReceiving.value) {
      return;
    }
    // 修改旧用户消息的显示状态
    const oldUserMessageId = param.message.messageId;
    const oldUserMessageItem = getMessage(oldUserMessageId);
    if (!oldUserMessageItem) {
      return;
    }
    oldUserMessageItem.active = false;
    isReceiving.value = true;
    // 添加用户消息
    const userMessageId = uuid();
    addMessage({
      messageId: userMessageId,
      parentMessageId: oldUserMessageItem.parentMessageId,
      conversationId: oldUserMessageItem.conversationId,
      active: true,
      content: param.content,
      role: 'user',
      files: oldUserMessageItem.files
    });
    if (option?.scrollContent) {
      nextTick(() => {
        option?.scrollContent && option.scrollContent('bottom');
      });
    }
    // 接收回复消息
    const contexts = getContextMessages(messages.value, void 0, userMessageId);
    startChatCompletion(
      {
        ...omit(param, ['content', 'files', 'message']),
        messages: contexts,
        conversation_id: oldUserMessageItem.conversationId,
        parent_message_id: oldUserMessageItem.parentMessageId,
        regenerate: false,
        regenerate_message_id: void 0
      },
      userMessageId,
      oldUserMessageItem.conversationId
    );
  };

  /** 重新生成回复消息 */
  const regenerateMessage = (param) => {
    if (!param.message) {
      return;
    }
    if (isReceiving.value) {
      return;
    }
    eachMessages((msgItem) => {
      msgItem.editStatus = false;
    });
    const oldAiMessageId = param.message.messageId;
    const contexts = getContextMessages(messages.value, oldAiMessageId);
    // 修改旧回复消息的显示状态
    const oldAiMessageItem = getMessage(oldAiMessageId);
    if (!oldAiMessageItem) {
      return;
    }
    oldAiMessageItem.active = false;
    isReceiving.value = true;
    // 接收新的回复消息
    startChatCompletion(
      {
        ...omit(param, ['content', 'files', 'message']),
        messages: contexts,
        conversation_id: oldAiMessageItem.conversationId,
        parent_message_id: oldAiMessageItem.parentMessageId,
        regenerate: true,
        regenerate_message_id: oldAiMessageItem.messageId
      },
      oldAiMessageItem.parentMessageId,
      oldAiMessageItem.conversationId
    );
  };

  /** 切换上一个回复消息 */
  const showPrevMessage = (messageId) => {
    if (isReceiving.value) {
      return;
    }
    const currItem = getMessage(messageId);
    if (currItem) {
      const prevIndex = (currItem.messageIndex ?? 0) - 1;
      if (prevIndex >= 0) {
        const prevItem = findMessage(
          (item) =>
            item.parentMessageId === currItem.parentMessageId &&
            item.messageIndex === prevIndex
        );
        if (prevItem) {
          currItem.active = false;
          prevItem.active = true;
        }
      }
    }
  };

  /** 切换下一个回复消息 */
  const showNextMessage = (messageId) => {
    if (isReceiving.value) {
      return;
    }
    const currItem = getMessage(messageId);
    if (currItem) {
      const nextIndex = (currItem.messageIndex ?? 0) + 1;
      if (nextIndex <= (currItem.messageCount ?? 0) - 1) {
        const nextItem = findMessage(
          (item) =>
            item.parentMessageId === currItem.parentMessageId &&
            item.messageIndex === nextIndex
        );
        if (nextItem) {
          currItem.active = false;
          nextItem.active = true;
        }
      }
    }
  };

  /** 中断消息 */
  const stopReceiving = () => {
    stopChatCompletion();
    messageList.value.forEach((item) => {
      if (
        item.status === 'loading' ||
        item.status === 'thinking' ||
        item.status === 'receiving'
      ) {
        item.status = 'finish';
      }
    });
    isReceiving.value = false;
  };

  onBeforeUnmount(() => {
    stopReceiving();
  });

  return {
    conversations,
    selectedConversationKey,
    isReceiving,
    messages,
    eachMessages,
    setMessage,
    setMessages,
    setConversation,
    setConversations,
    removeConversation,
    sendMessage,
    resendMessage,
    regenerateMessage,
    showPrevMessage,
    showNextMessage,
    stopReceiving
  };
}
