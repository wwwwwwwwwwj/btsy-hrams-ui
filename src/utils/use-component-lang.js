import { ref, computed } from 'vue';

/**
 * 组件支持多语言
 * @param langs 组件多语言文案
 * @param props 组件属性
 */
export function useComponentLang(langs, props) {
  const locale = ref('zh_CN');

  const lang = computed(() => {
    return Object.assign(
      {},
      langs.zh_CN,
      (locale.value ? langs[locale.value] : void 0) || {},
      props?.componentLang
    );
  });

  return { lang };
}
