<!-- AI对话 -->
<template>
  <EleChat
    v-bind="{ ...emitProps, ...pick($props, chatPropsKeys) }"
    :logoSrc="logoSrc ?? logoImgUrl"
    :logoTitle="logoTitle ?? lang.name"
    :logoImgStyle="logoImgStyle ?? { transform: 'scale(1.2) translateY(1px)' }"
    v-model="content"
    :conversations="conversationGroups"
    :active="selectedConversationKey"
    :messages="messages"
    :files="files"
    :sendBtnProps="inputSendBtnProps"
    :dropdownProps="dropdownProps ?? { iconProps: { size: 15 } }"
    :dropdownItems="dropdownItems ?? conversationDropdownItems"
    ref="chatRef"
    @newBtnClick="handleNewBtnClick"
    @conversationClick="handleConversationClick"
    @sendBtnClick="handleSendBtnClick"
    @send="handleSend"
    @input="stopSpeech()"
    @fileClick="handleFileClick"
    @fileRemove="handleFileRemove"
    @fileUpload="handleFileUpload"
    @bubbleEditCancel="handleBubbleEditCancel"
    @bubbleEditConfirm="handleBubbleEditConfirm"
  >
    <template
      v-for="name in Object.keys($slots).filter(
        (k) => !slotExcludes.includes(k)
      )"
      #[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
    <template #inputLeftTools>
      <slot name="inputLeftTools"></slot>
      <InputTool
        :button="true"
        :icon="ModelOutlined"
        :label="modelDropdownLabel"
        :dropdownItems="models"
        :dropdownProps="{
          iconProps: { size: 13 },
          modelValue: selectedModel,
          'onUpdate:modelValue': handleModelChange
        }"
      >
        <ElIcon :size="12" style="margin-left: 2px">
          <ArrowDown />
        </ElIcon>
      </InputTool>
      <InputTool
        :button="true"
        :icon="DeepThinkOutlined"
        :label="lang.deepThink"
        :selected="isDeepThink"
        @click="handleDeepThinkClick"
      />
    </template>
    <template #inputRightTools>
      <slot name="inputRightTools"></slot>
      <InputTool
        v-if="isListening"
        :icon="VoiceAnimOutlined"
        :iconProps="{ size: 23 }"
        :selected="true"
        :label="lang.stopSpeech"
        style="order: 2; margin: 0"
        @click="handleSpeech"
      />
      <InputTool
        v-else
        :icon="AudioOutlined"
        :label="lang.speech"
        style="order: 2; margin: 0"
        @click="handleSpeech"
      />
    </template>
    <template #itemFooter="{ item }">
      <slot name="itemFooter" :item="item"></slot>
      <template v-if="item.placement === 'end'">
        <BubbleCopy
          :content="item.content"
          :tooltip="lang.copy"
          :successTooltip="lang.copySuccess"
          :errorTooltip="lang.copyError"
        />
        <BubbleTool
          :icon="EditOutlined"
          :tooltip="lang.edit"
          @click="handleEditMessage(item)"
        />
      </template>
      <template v-if="item.messageCount && item.messageCount > 1">
        <BubbleTool
          :disabled="!item.messageIndex"
          :icon="ArrowLeft"
          @click="showPrevMessage(item.messageId)"
        />
        <BubbleTool type="text" style="margin: 0; width: auto">
          <span>{{ (item.messageIndex ?? 0) + 1 }}</span>
          <span style="padding: 0 2px">/</span>
          <span>{{ item.messageCount }}</span>
        </BubbleTool>
        <BubbleTool
          :disabled="
            item.messageIndex != null &&
            item.messageIndex >= item.messageCount - 1
          "
          :icon="ArrowRight"
          style="margin: 0"
          @click="showNextMessage(item.messageId)"
        />
      </template>
      <template v-if="item.placement !== 'end'">
        <BubbleTool
          :icon="SyncOutlined"
          :tooltip="lang.regenerate"
          @click="handleReplyMessage(item)"
        />
        <BubbleCopy
          :content="item.content"
          :tooltip="lang.copy"
          :successTooltip="lang.copySuccess"
          :errorTooltip="lang.copyError"
        />
        <BubbleTool
          v-if="item.speakStatus === 'loading'"
          :icon="LoadingDotOutlined"
          :iconStyle="{ transform: 'scale(1.1)' }"
          :iconProps="{ class: 'is-loading' }"
          :tooltip="lang.stopSpeak"
          @click="handleSpeakMessage(item)"
        />
        <BubbleTool
          v-else-if="item.speakStatus === 'playing'"
          :icon="StopPlayOutlined"
          :iconStyle="{ transform: 'scale(1.1)' }"
          :tooltip="lang.stopSpeak"
          @click="handleSpeakMessage(item)"
        />
        <BubbleTool
          v-else
          :icon="SoundOutlined"
          :iconStyle="{ transform: 'scale(1.1)' }"
          :tooltip="lang.speak"
          @click="handleSpeakMessage(item)"
        />
      </template>
    </template>
    <template #itemContent="{ item }">
      <div
        v-if="
          item.placement === 'end' ||
          item.content == null ||
          item.content.trim() === ''
        "
        class="ele-chat-bubble-content-text"
      >
        {{ item.content }}
      </div>
      <ByteMdViewer v-else :value="item.content" />
    </template>
    <template v-if="selectedConversationKey == null" #content>
      <transition name="zoom-in" :appear="true">
        <WelcomeView
          :lang="lang"
          :logoSrc="logoSrc ?? logoImgUrl"
          :logoTitle="logoTitle ?? lang.name"
          @promptClick="handlePromptClick"
        >
          <template v-if="$slots.content">
            <slot name="content"></slot>
          </template>
        </WelcomeView>
      </transition>
    </template>
  </EleChat>
</template>

<script setup>
  import { ref, computed, nextTick, markRaw } from 'vue';
  import { useModal, pick, useComponentEvents } from 'ele-admin-plus';
  import {
    chatProps,
    chatEmits,
    chatPropsKeys
  } from 'ele-admin-plus/es/ele-chat/props';
  import {
    InputTool,
    BubbleTool
  } from 'ele-admin-plus/es/ele-chat/components/index';
  import {
    AudioOutlined,
    VoiceAnimOutlined,
    DeepThinkOutlined,
    ModelOutlined,
    ArrowDown,
    SyncOutlined,
    EditOutlined,
    SoundOutlined,
    StopPlayOutlined,
    LoadingDotOutlined,
    ArrowLeft,
    ArrowRight,
    DeleteOutlined,
    PinOutlined,
    UnpinOutlined
  } from '@/components/icons';
  import { isImageUrl } from '@/utils/common';
  import { useSpeech } from '@/utils/use-speech';
  import { useSpeak } from '@/utils/use-speak';
  import { useComponentLang } from '@/utils/use-component-lang';
  import ByteMdViewer from '@/components/ByteMdViewer/index.vue';
  import BubbleCopy from './components/bubble-copy.vue';
  import WelcomeView from './components/welcome-view.vue';
  import {
    getConversationsApi,
    removeConversationApi,
    renameConversationApi,
    pinConversationApi,
    unpinConversationApi,
    getMessagesApi,
    getModelsApi,
    uploadFileApi
  } from './config';
  import { useAiChat } from './util';
  import logoImgUrl from '@/assets/ai-logo.webp';
  const slotExcludes = [
    'inputLeftTools',
    'inputRightTools',
    'itemFooter',
    'content'
  ];

  defineOptions({ name: 'AiChat' });

  const props = defineProps({
    ...chatProps,
    /** 更多附件上传请求参数 */
    uploadApiParams: Object,
    /** 附件最大选择个数 */
    fileMaximum: {
      type: Number,
      default: 20
    },
    /** 附件选择大小限制 */
    fileSizeLimit: {
      type: Number,
      default: 100
    },
    /** useAiSdk 参数 */
    aiSdkOption: Object,
    /** 自定义文案 */
    componentLang: Object
  });

  const emit = defineEmits(chatEmits);

  const { emitProps } = useComponentEvents(chatEmits, emit);

  const { message: EleMessage, messageBox: ElMessageBox } = useModal();

  const { lang } = useComponentLang(
    {
      zh_CN: {
        name: '智能助手',
        speech: '语音输入',
        stopSpeech: '停止语音输入',
        selectModel: '模型选择',
        deepThink: '深度思考',
        regenerate: '重新生成',
        copy: '复制',
        copySuccess: '复制成功',
        copyError: '复制失败',
        edit: '编辑',
        speak: '朗读',
        stopSpeak: '停止朗读',
        deleteChat: '删除',
        deleteChatConfirm: '删除后不可恢复，确定要删除此对话吗？',
        renameChat: '重命名',
        renameChatPlaceholder: '请输入对话名称',
        pinChat: '置顶',
        unpinChat: '取消置顶',
        limitError: '大小不能超过 {limit}MB',
        maximumError: '最多上传 {maximum}个附件',
        emptySendError: '请输入你的问题',
        stopReceiving: '停止生成',
        speechNotAllowed: '未开启麦克风权限',
        groupPin: '已置顶',
        groupUnpin: '最近对话',
        welcomeTitle: '你好，我是',
        welcomeText: '我可以帮助你解决使用中遇到的问题~',
        welcomeTip: '🤖 你可以这样问我：'
      },
      zh_TW: {
        name: '智能助手',
        speech: '語音輸入',
        stopSpeech: '停止語音輸入',
        selectModel: '模型選擇',
        deepThink: '深度思考',
        regenerate: '重新生成',
        copy: '複製',
        copySuccess: '複製成功',
        copyError: '複製失敗',
        edit: '編輯',
        speak: '朗讀',
        stopSpeak: '停止朗讀',
        deleteChat: '刪除',
        deleteChatConfirm: '刪除後不可恢復，確定要刪除此對話嗎？',
        renameChat: '重命名',
        renameChatPlaceholder: '請輸入對話名稱',
        pinChat: '置頂',
        unpinChat: '取消置頂',
        limitError: '大小不能超過 {limit}MB',
        maximumError: '最多上傳 {maximum}個附件',
        emptySendError: '請輸入您的問題',
        stopReceiving: '停止生成',
        speechNotAllowed: '未開啟麥克風權限',
        groupPin: '已置頂',
        groupUnpin: '最近對話',
        welcomeTitle: '你好，我是',
        welcomeText: '我可以幫助你解決使用中遇到的問題~',
        welcomeTip: '🤖 你可以這樣問我：'
      },
      en: {
        name: 'AI Assistant',
        speech: 'Voice input',
        stopSpeech: 'Stop recording',
        selectModel: 'Select model',
        deepThink: 'Deep think',
        regenerate: 'Regenerate',
        copy: 'Copy',
        copySuccess: 'Copied',
        copyError: 'Copy failed',
        edit: 'Edit',
        speak: 'Read aloud',
        stopSpeak: 'Stop reading',
        deleteChat: 'Delete',
        deleteChatConfirm: 'This action cannot be undone. Delete this chat?',
        renameChat: 'Rename',
        renameChatPlaceholder: 'Please enter chat name',
        pinChat: 'Pin',
        unpinChat: ' Unpin',
        limitError: 'File size cannot exceed {limit}MB',
        maximumError: 'Maximum {maximum} attachments allowed',
        emptySendError: 'Please type your question',
        stopReceiving: 'Stop generating',
        speechNotAllowed: 'Microphone permission not enabled',
        groupPin: 'Pinned',
        groupUnpin: 'Conversations',
        welcomeTitle: 'Hello, I am ',
        welcomeText: 'I can help you solve problems you encounter~',
        welcomeTip: '🤖 You can ask me like this:'
      }
    },
    props
  );

  /** 聊天组件 */
  const chatRef = ref(null);

  /** 输入内容 */
  const content = ref('');

  /** 已上传附件 */
  const files = ref([]);

  /** 是否开启深度思考 */
  const isDeepThink = ref(false);

  /** 选中模型 */
  const selectedModel = ref();

  /** 模型列表 */
  const models = ref([]);

  /** 输入内容是否为空 */
  const isEmptyContent = computed(
    () => !content.value || !content.value.trim()
  );

  /** 发送按钮属性 */
  const inputSendBtnProps = computed(() => {
    const tooltip = isReceiving.value
      ? lang.value.stopReceiving
      : isEmptyContent.value
        ? lang.value.emptySendError
        : void 0;
    return {
      loading: isReceiving.value,
      disabled: isEmptyContent.value && !isReceiving.value,
      label: tooltip,
      key: tooltip
    };
  });

  /** 选中模型名称 */
  const modelDropdownLabel = computed(() => {
    const selected =
      selectedModel.value == null
        ? void 0
        : models.value.find((d) => d.command === selectedModel.value);
    return selected?.title ?? lang.value.selectModel;
  });

  /** 滚动内容区域 */
  const scrollContent = (position) => {
    if (!chatRef.value) {
      return;
    }
    if (position === 'top') {
      chatRef.value.contentScrollToTop({
        behavior: 'instant'
      });
      return;
    }
    chatRef.value.contentScrollToBottom({
      behavior: 'instant'
    });
  };

  /** 对话操作 */
  const {
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
  } = useAiChat({
    aiAvatar: logoImgUrl,
    aiName: lang.value.name,
    aiSdkOption: props.aiSdkOption,
    scrollContent
  });

  /** 对话分组列表 */
  const conversationGroups = computed(() => {
    const pinned = [];
    const unpinned = [];
    conversations.value.forEach((item) => {
      if (item.isPinned) {
        pinned.push(item);
      } else {
        unpinned.push(item);
      }
    });
    const result = [];
    if (pinned.length) {
      pinned.sort((a, b) => (b.pinTime ?? 0) - (a.pinTime ?? 0));
      result.push({
        key: 'groupPin',
        group: true,
        label: lang.value.groupPin,
        children: pinned
      });
    }
    if (unpinned.length) {
      result.push({
        key: 'groupUnpin',
        group: true,
        label: lang.value.groupUnpin,
        children: unpinned
      });
    }
    return result;
  });

  /** 附件点击事件 */
  const handleFileClick = (file) => {
    if (!isImageUrl(file.name) && file.url) {
      window.open(file.url);
    }
  };

  /** 附件删除事件 */
  const handleFileRemove = (file) => {
    const index = files.value.indexOf(file);
    files.value.splice(index, 1);
  };

  /** 校验选择的文件 */
  const checkFile = (file) => {
    // 限制文件个数
    if (props.fileMaximum && files.value.length >= props.fileMaximum) {
      EleMessage.error({
        message: lang.value.maximumError.replace(
          /\{\s*maximum\s*\}/g,
          String(props.fileMaximum)
        ),
        grouping: true,
        plain: true
      });
      return;
    }
    if (!file) {
      return;
    }
    // 限制文件大小
    if (props.fileSizeLimit && file.size / 1024 / 1024 > props.fileSizeLimit) {
      EleMessage.error({
        message: lang.value.limitError.replace(
          /\{\s*limit\s*\}/g,
          String(props.fileSizeLimit)
        ),
        grouping: true,
        plain: true
      });
      return;
    }
    return true;
  };

  /** 附件上传事件 */
  const handleFileUpload = (data) => {
    if (!data.file || !checkFile(data.file)) {
      return;
    }
    files.value.push({ ...data });
    const item = files.value.find((t) => t.key === data.key);
    if (!item) {
      return;
    }
    item.status = 'uploading';
    uploadFileApi(data.file, {}, item.name, props.uploadApiParams)
      .then((res) => {
        item.status = 'done';
        item.url = res.url;
        item.response = res;
        if (!isImageUrl(item.name)) {
          item.imageUrl = res.url;
        }
      })
      .catch((e) => {
        item.status = 'exception';
        EleMessage.error({ message: e.message, grouping: true, plain: true });
      });
  };

  /** 回车发送事件 */
  const handleSend = () => {
    if (isReceiving.value) {
      return;
    }
    if (isEmptyContent.value) {
      EleMessage.error({ message: lang.value.emptySendError, plain: true });
      return;
    }
    stopSpeechAndSpeak();
    sendMessage({
      content: content.value,
      files: files.value,
      model: selectedModel.value,
      enable_thinking: isDeepThink.value
    });
    content.value = '';
    files.value = [];
  };

  /** 发送按钮点击事件 */
  const handleSendBtnClick = () => {
    if (isReceiving.value) {
      stopReceiving();
      return;
    }
    handleSend();
  };

  /** 重新生成消息 */
  const handleReplyMessage = (item) => {
    if (!isReceiving.value) {
      stopSpeechAndSpeak();
      regenerateMessage({
        message: item,
        model: selectedModel.value,
        enable_thinking: isDeepThink.value
      });
    }
  };

  /** 编辑消息 */
  const handleEditMessage = (item) => {
    if (!isReceiving.value) {
      eachMessages((msgItem) => {
        msgItem.editStatus = item.messageId === msgItem.messageId;
      });
    }
  };

  /** 编辑消息取消事件 */
  const handleBubbleEditCancel = (item) => {
    setMessage(item.messageId, 'editStatus', false);
  };

  /** 编辑消息确认事件 */
  const handleBubbleEditConfirm = (item, text) => {
    if (!isReceiving.value && text && text.trim()) {
      handleBubbleEditCancel(item);
      stopSpeechAndSpeak();
      resendMessage({
        content: text,
        message: item,
        model: selectedModel.value,
        enable_thinking: isDeepThink.value
      });
    }
  };

  /** 新对话按钮点击事件 */
  const handleNewBtnClick = () => {
    stopReceiving();
    stopSpeechAndSpeak();
    setMessages([]);
    selectedConversationKey.value = void 0;
    nextTick(() => {
      scrollContent('top');
    });
  };

  /** 对话列表点击事件 */
  const handleConversationClick = (item) => {
    if (selectedConversationKey.value === item.key) {
      return;
    }
    stopReceiving();
    stopSpeechAndSpeak();
    setMessages([]);
    const conversationKey = item.key;
    selectedConversationKey.value = item.key;
    // TODO 增加主体区域 loading
    getMessagesApi(item.conversationId)
      .then((data) => {
        if (selectedConversationKey.value !== conversationKey) {
          return;
        }
        setMessages(data);
        nextTick(() => {
          scrollContent();
        });
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 删除对话 */
  const handleDeleteConversation = (item) => {
    ElMessageBox.confirm(lang.value.deleteChatConfirm, lang.value.deleteChat, {
      type: 'warning',
      draggable: true,
      closeOnClickModal: false,
      beforeClose: (action, instance, done) => {
        if (action !== 'confirm') {
          done();
          return;
        }
        if (selectedConversationKey.value == item.key) {
          stopReceiving();
          stopSpeechAndSpeak();
        }
        instance.confirmButtonLoading = true;
        removeConversationApi(item.conversationId)
          .then((msg) => {
            done();
            removeConversation(item.conversationId);
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            instance.confirmButtonLoading = false;
            EleMessage.error({ message: e.message, plain: true });
          });
      }
    })
      .then(() => {})
      .catch(() => {});
  };

  /** 重命名对话 */
  const handleRenameConversation = (item) => {
    ElMessageBox.prompt(void 0, lang.value.renameChat, {
      draggable: true,
      closeOnClickModal: false,
      inputValue: item.label,
      inputPlaceholder: lang.value.renameChatPlaceholder,
      inputErrorMessage: lang.value.renameChatPlaceholder,
      inputValidator: (value) => !!value.trim(),
      beforeClose: (action, instance, done) => {
        if (action !== 'confirm') {
          done();
          return;
        }
        instance.confirmButtonLoading = true;
        const name = instance.inputValue;
        renameConversationApi(item.conversationId, name)
          .then((msg) => {
            done();
            setConversation(item.conversationId, 'label', name);
            EleMessage.success({ message: msg, plain: true });
          })
          .catch((e) => {
            instance.confirmButtonLoading = false;
            EleMessage.error({ message: e.message, plain: true });
          });
      }
    })
      .then(() => {})
      .catch(() => {});
  };

  /** 置顶对话 */
  const handlePinConversation = (item) => {
    pinConversationApi(item.conversationId)
      .then(() => {
        setConversation(item.conversationId, 'isPinned', true);
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 取消置顶对话 */
  const handleUnpinConversation = (item) => {
    unpinConversationApi(item.conversationId)
      .then(() => {
        setConversation(item.conversationId, 'isPinned', false);
      })
      .catch((e) => {
        EleMessage.error({ message: e.message, plain: true });
      });
  };

  /** 对话列表下拉菜单 */
  const conversationDropdownItems = (item) => {
    if (item.children != null) {
      return;
    }
    const menus = [
      {
        title: lang.value.renameChat,
        command: 'rename',
        icon: EditOutlined,
        iconStyle: { transform: 'scale(0.92)' },
        onClick: () => handleRenameConversation(item)
      }
    ];

    if (item.isPinned) {
      menus.push({
        title: lang.value.unpinChat,
        command: 'unpin',
        icon: UnpinOutlined,
        onClick: () => handleUnpinConversation(item)
      });
    } else {
      menus.push({
        title: lang.value.pinChat,
        command: 'pin',
        icon: PinOutlined,
        onClick: () => handlePinConversation(item)
      });
    }
    menus.push({
      title: lang.value.deleteChat,
      command: 'delete',
      icon: DeleteOutlined,
      iconStyle: { transform: 'scale(0.9)' },
      divided: true,
      danger: true,
      onClick: () => handleDeleteConversation(item)
    });
    return menus;
  };

  /** 开关深度思考 */
  const handleDeepThinkClick = () => {
    isDeepThink.value = !isDeepThink.value;
  };

  /** 模型选择事件 */
  const handleModelChange = (value) => {
    selectedModel.value = value;
  };

  /** 欢迎页提示点击事件 */
  const handlePromptClick = (item) => {
    if (!isReceiving.value) {
      stopSpeechAndSpeak();
      sendMessage({
        content: item.label,
        model: selectedModel.value,
        enable_thinking: isDeepThink.value
      });
    }
  };

  /** 语音识别操作 */
  const { startSpeech, stopSpeech, isListening } = useSpeech({
    onSpeech: (text) => {
      content.value = text;
    },
    onError: (e) => {
      if (e.message && e.message.includes('not-allowed')) {
        EleMessage.error({ message: lang.value.speechNotAllowed, plain: true });
      }
    }
  });

  /** 开始语音识别 */
  const handleSpeech = () => {
    stopSpeak();
    if (isListening.value) {
      stopSpeech();
      return;
    }
    startSpeech(content.value);
  };

  /** 语音合成操作 */
  const { startSpeak, stopSpeak } = useSpeak({
    onInit: (messageId) => {
      setMessage(messageId, 'speakStatus', 'loading');
    },
    onStart: (messageId) => {
      setMessage(messageId, 'speakStatus', 'playing');
    },
    onStop: (messageId) => {
      setMessage(messageId, 'speakStatus', void 0);
    },
    onError: (e) => {
      if (!['canceled', 'interrupted'].includes(e.message)) {
        console.error(e);
      }
    }
  });

  /** 停止语音识别和朗读 */
  const stopSpeechAndSpeak = () => {
    stopSpeech();
    stopSpeak();
    eachMessages((msgItem) => {
      msgItem.speakStatus = void 0;
    });
  };

  /** 朗读消息 */
  const handleSpeakMessage = (item) => {
    stopSpeechAndSpeak();
    const { speakStatus: status, content, messageId } = item;
    if (status !== 'loading' && status !== 'playing' && !isReceiving.value) {
      startSpeak(content, messageId);
    }
  };

  /** 查询对话列表 */
  getConversationsApi()
    .then((data) => {
      setConversations(data);
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });

  /** 查询模型列表 */
  getModelsApi()
    .then((data) => {
      models.value = data.map((item) => ({
        command: item.id,
        title: item.name,
        icon: markRaw(ModelOutlined)
      }));
    })
    .catch((e) => {
      EleMessage.error({ message: e.message, plain: true });
    });
</script>
