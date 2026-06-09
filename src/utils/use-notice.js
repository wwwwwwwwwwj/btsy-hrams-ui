import { watch } from 'vue';
import { useEventSource, useWebSocket } from '@vueuse/core';
import { ElNotification } from 'element-plus';
import dayjs from 'dayjs';
import { useNoticeStore } from '@/store/modules/notice';
import { getToken } from './token-util';

/**
 * 消息通知连接
 */
export function useNotice() {
  const noticeStore = useNoticeStore();

  const baseApi = import.meta.env.VITE_API_URL;
  const token = getToken();
  const clientId = import.meta.env.VITE_APP_CLIENT_ID;
  const sseUrl = `${baseApi}/resource/sse?Authorization=Bearer ${token}&clientid=${clientId}`;
  const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
  const wsUrl = `${protocol}${baseApi}/resource/websocket?Authorization=Bearer ${token}&clientid=${clientId}`;

  /** ws操作 */
  const { open: openWebSocket, close: closeWebSocket } = useWebSocket(wsUrl, {
    immediate: false,
    autoReconnect: {
      retries: 3,
      delay: 1000,
      onFailed() {
        console.error('websocket重连失败');
      }
    },
    heartbeat: {
      message: JSON.stringify({ type: 'ping' }),
      interval: 10000,
      pongTimeout: 2000
    },
    onConnected() {
      console.log('websocket已经连接');
    },
    onDisconnected() {
      console.log('websocket已经断开');
    },
    onMessage: (_, e) => {
      const message = e.data;
      if (message.includes('ping')) {
        return;
      }
      noticeStore.addNotice({
        message,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        read: false
      });
      ElNotification({
        title: '消息',
        message,
        type: 'info',
        duration: 3000,
        offset: 42
      });
    }
  });

  /** sse操作 */
  const {
    open: openSSE,
    close: closeSSE,
    data: sseData,
    error: sseError
  } = useEventSource(sseUrl, [], {
    immediate: false,
    autoReconnect: {
      retries: 10,
      delay: 3000,
      onFailed() {
        console.error('Failed to connect after 10 retries');
      }
    }
  });

  watch(sseError, (error) => {
    if (!error) {
      return;
    }
    console.error('SSE connection error:', error);
    sseError.value = null;
  });

  watch(sseData, (message) => {
    if (!message) {
      return;
    }
    noticeStore.addNotice({
      message,
      time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      read: false
    });
    ElNotification({
      title: '消息',
      message,
      type: 'info',
      duration: 3000,
      offset: 42
    });
    sseData.value = null;
  });

  /** 初始化sse连接 */
  const initSSE = () => {
    if (import.meta.env.VITE_APP_SSE == 'true') {
      openSSE();
    }
  };

  /** 初始化websocket连接 */
  const initWebSocket = () => {
    if (import.meta.env.VITE_APP_WEBSOCKET == 'true') {
      openWebSocket();
    }
  };

  return {
    initSSE,
    closeSSE,
    initWebSocket,
    closeWebSocket
  };
}
