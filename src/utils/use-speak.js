import { ref, watch } from 'vue';
import { useSpeechSynthesis } from '@vueuse/core';
/** 内容只保留中文, 英文, 数字和常见的标点符号 */
const TEXT_REGEX =
  /[^\u4e00-\u9fa5a-zA-Z0-9\s，。！？、；：“”‘’（）【】《》…—·+\-*/,.!?;:'"()\[\]<>]/g;

/**
 * 语音合成操作
 * @param option 参数
 */
export function useSpeak(option) {
  const speakContent = ref('');
  const { isSupported, isPlaying, error, stop, speak } = useSpeechSynthesis(
    speakContent,
    {
      lang: 'zh-CN',
      rate: 1,
      volume: 1,
      ...(option?.options || {})
    }
  );

  /** 开始回调会要传递的值 */
  let playId;

  /** 停止回调需要传递的值 */
  let stopId;

  /** 停止 */
  const stopSpeak = () => {
    if (isPlaying.value && stopId != null) {
      option?.onStop && option.onStop(stopId);
      stopId = void 0;
    }
    stop();
  };

  /** 开始 */
  const startSpeak = (text, id) => {
    if (!isSupported.value) {
      option?.onError && option?.onError(new Error('not-supported'));
      return;
    }
    stopSpeak();
    speakContent.value = (text ?? '').replace(TEXT_REGEX, '');
    if (speakContent.value) {
      option?.onInit && option.onInit(id);
      playId = id;
      speak();
    }
  };

  /** 监听状态 */
  watch(isPlaying, (playing) => {
    if (playing) {
      stopId = playId;
      option?.onStart && option.onStart(playId);
    } else if (stopId != null) {
      option?.onStop && option.onStop(stopId);
      stopId = void 0;
    }
  });

  /** 监听失败 */
  watch(error, (e) => {
    const errorMsg = e?.error;
    option?.onError && option?.onError(new Error(errorMsg));
  });

  return {
    startSpeak,
    stopSpeak,
    isPlaying
  };
}
