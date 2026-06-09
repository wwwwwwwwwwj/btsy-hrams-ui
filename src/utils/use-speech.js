import { watch } from 'vue';
import { useSpeechRecognition } from '@vueuse/core';

/**
 * 语音识别操作
 * @param option 参数
 */
export function useSpeech(option) {
  const { isSupported, isListening, isFinal, result, error, start, stop } =
    useSpeechRecognition({
      lang: 'zh-CN',
      continuous: true,
      interimResults: true,
      ...(option?.options || {})
    });

  /** 拼接完整的内容 */
  let lastContent = null;

  /** 开始 */
  const startSpeech = (content) => {
    if (isListening.value) {
      return;
    }
    stop();
    if (!isSupported.value) {
      option?.onError && option?.onError(new Error('not-supported'));
      return;
    }
    lastContent = content ?? '';
    start();
  };

  /** 停止 */
  const stopSpeech = () => {
    lastContent = null;
    stop();
  };

  /** 监听识别到结果 */
  watch(result, (text) => {
    if (lastContent != null) {
      const content = `${lastContent}${text}`;
      if (isFinal.value) {
        lastContent = content;
      }
      option?.onSpeech && option.onSpeech(content, text, isFinal.value);
    }
  });

  /** 监听失败 */
  watch(error, (e) => {
    const errorMsg = e?.message;
    option?.onError && option?.onError(new Error(errorMsg));
  });

  return {
    startSpeech,
    stopSpeech,
    isListening
  };
}
