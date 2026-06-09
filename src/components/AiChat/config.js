import { uploadOss } from '@/api/system/oss';
import {
  getConversations,
  removeConversation,
  renameConversation,
  pinConversation,
  unpinConversation,
  getMessages,
  getModels,
  getPrompts
} from '@/api/ai/chat';

/** 对话接口 */
export const chatApiUrl = '/chat/completions';

/** 默认模型 */
export const defaultModel = 'deepseek-r1-250528';

/**
 * 获取对话列表接口
 */
export const getConversationsApi = getConversations;

/**
 * 删除对话接口
 * @param conversationId 对话 id
 */
export const removeConversationApi = removeConversation;

/**
 * 重命名对话接口
 * @param conversationId 对话 id
 * @param name 新的名称
 */
export const renameConversationApi = renameConversation;

/**
 * 置顶对话接口
 * @param conversationId 对话 id
 */
export const pinConversationApi = pinConversation;

/**
 * 取消置顶对话接口
 * @param conversationId 对话 id
 */
export const unpinConversationApi = unpinConversation;

/**
 * 获取对话消息接口
 * @param conversationId 对话 id
 */
export const getMessagesApi = getMessages;

/**
 * 获取模型列表接口
 */
export const getModelsApi = getModels;

/**
 * 获取提示列表接口
 */
export const getPromptsApi = getPrompts;

/**
 * 上传文件接口
 */
export const uploadFileApi = uploadOss;
