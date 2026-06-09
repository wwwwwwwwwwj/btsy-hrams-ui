import { visit } from 'unist-util-visit';
import { toText } from 'hast-util-to-text';
import mermaid from 'mermaid';
import { uuid, isExternalLink, copyText } from 'ele-admin-plus';
import { download } from '@/utils/common';
const codeWrapperClass = 'ele-md-body-code';
const codeMermaidClass = 'ele-md-body-mermaid';
const mermaidShowClass = 'is-show-mermaid';
const mermaidRenderedClass = 'is-mermaid-rendered';
const copySuccessClass = 'is-copy-success';
/** 代码高亮时重设语言名称 */
const defaultHljsLangMap = [
  ['vue', 'xml'],
  ['mermaid', 'less'],
  ['batch', 'bash']
];
/** 代码下载时对应的文件后缀 */
const defaultCodeSuffixMap = [
  ['markdown', 'md'],
  ['pascal', 'pas'],
  ['batch', 'bat'],
  ['actionscript', 'as'],
  ['ada', 'adb'],
  ['angelscript', 'asc'],
  ['applescript', 'scpt'],
  ['arcade', 'apl'],
  ['arduino', 'ino'],
  ['armasm', 's'],
  ['aspectj', 'aj'],
  ['autohotkey', 'ahk'],
  ['autoit', 'au3'],
  ['avrasm', 'S'],
  ['awk', 'awk'],
  ['axapta', 'xpp'],
  ['bash', 'sh'],
  ['basic', 'bas'],
  ['brainfuck', 'bf'],
  ['capnproto', 'capnp'],
  ['clean', 'icl'],
  ['clojure', 'clj'],
  ['coffeescript', 'coffee'],
  ['coq', 'v'],
  ['cos', 'cls'],
  ['crmsh', 'conf'],
  ['crystal', 'cr'],
  ['csharp', 'cs'],
  ['delphi', 'pas'],
  ['django', 'html'],
  ['dos', 'bat'],
  ['elixir', 'ex'],
  ['ruby', 'rb'],
  ['erb', 'erb'],
  ['erlang', 'erl'],
  ['fortran', 'f90'],
  ['fsharp', 'fs'],
  ['gams', 'gms'],
  ['gauss', 'gss'],
  ['gcode', 'nc'],
  ['gherkin', 'feature'],
  ['glsl', 'vert'],
  ['handlebars', 'hbs'],
  ['haskell', 'hs'],
  ['haxe', 'hx'],
  ['inform7', 'ni'],
  ['irpf90', 'F90'],
  ['javascript', 'js'],
  ['jboss-cli', 'cli'],
  ['julia', 'jl'],
  ['kotlin', 'kt'],
  ['latex', 'tex'],
  ['livecodeserver', 'lc'],
  ['livescript', 'ls'],
  ['llvm', 'll'],
  ['makefile', 'mk'],
  ['mathematica', 'nb'],
  ['matlab', 'm'],
  ['maxima', 'mac'],
  ['mercury', 'm'],
  ['mipsasm', 's'],
  ['mizar', 'miz'],
  ['perl', 'pl'],
  ['mojolicious', 'pm'],
  ['moonscript', 'moon'],
  ['nestedtext', 'nt'],
  ['nginx', 'conf'],
  ['nsis', 'nsi'],
  ['objectivec', 'm'],
  ['ocaml', 'ml'],
  ['openscad', 'scad'],
  ['parser3', 'p'],
  ['pgsql', 'sql'],
  ['plaintext', 'txt'],
  ['powershell', 'ps1'],
  ['processing', 'pde'],
  ['prolog', 'pl'],
  ['protobuf', 'proto'],
  ['puppet', 'pp'],
  ['purebasic', 'pb'],
  ['python', 'py'],
  ['reasonml', 're'],
  ['roboconf', 'graph'],
  ['routeros', 'rsc'],
  ['ruleslanguage', 'rul'],
  ['rust', 'rs'],
  ['scheme', 'scm'],
  ['scilab', 'sci'],
  ['shell', 'sh'],
  ['smalltalk', 'st'],
  ['stata', 'do'],
  ['step21', 'stp'],
  ['stylus', 'styl'],
  ['taggerscript', 'tas'],
  ['typescript', 'ts'],
  ['vbnet', 'vb'],
  ['vbscript', 'vbs'],
  ['verilog', 'v'],
  ['vhdl', 'vhd'],
  ['wasm', 'wat'],
  ['x86asm', 'asm'],
  ['xquery', 'xq'],
  ['zephir', 'zep']
];

/**
 * 国际化文案
 */
export const defaultLangs = {
  zh_CN: {
    copy: '复制',
    copySuccess: '已复制',
    download: '下载',
    zoomOut: '缩小',
    zoomIn: '放大',
    mermaidTheme: '切换主题',
    viewer: '全屏',
    mermaidTab: '图表',
    codeTab: '代码'
  },
  zh_TW: {
    copy: '複製',
    copySuccess: '已複製',
    download: '下載',
    zoomOut: '縮小',
    zoomIn: '放大',
    mermaidTheme: '切換主題',
    viewer: '全螢幕',
    mermaidTab: '圖表',
    codeTab: '程式碼'
  },
  en: {
    copy: 'Copy',
    copySuccess: 'Copied',
    download: 'Download',
    zoomOut: 'Zoom Out',
    zoomIn: 'Zoom In',
    mermaidTheme: 'Toggle Theme',
    viewer: 'Fullscreen',
    mermaidTab: 'Diagram',
    codeTab: 'Code'
  }
};

/**
 * 支持代码工具栏, 图表插件, 超链接新窗口打开
 */
export function eleMdProcess(option) {
  const locale = { ...defaultLangs.zh_CN, ...(option?.locale || {}) };
  const opt = { ...(option || {}), locale };
  return { rehype: (processor) => processor.use(rehypeEleMdProcess, opt) };
}

/**
 * 处理 markdown 节点树
 * @param option 配置
 */
export function rehypeEleMdProcess(option) {
  const locale = option.locale;
  const hljsLangMap = [...(option.hljsLangMap || []), ...defaultHljsLangMap];
  const suffixMap = [...(option.codeSuffixMap || []), ...defaultCodeSuffixMap];
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      // 超链接新窗口打开
      if (node.tagName === 'a') {
        if (!node.properties) {
          node.properties = {};
        }
        if (isExternalLink(node.properties.href)) {
          node.properties.target = '_blank';
        }
        return;
      }
      // 对代码块处理
      if (
        index == null ||
        node.tagName !== 'pre' ||
        !parent ||
        (parent.properties &&
          parent.properties.className &&
          parent.properties.className.includes(codeWrapperClass))
      ) {
        return;
      }
      const child = node.children.find((c) => c.tagName === 'code');
      if (!child) {
        return;
      }
      // 获取代码块语言名称
      const childClassNames = child.properties?.className
        ? [child.properties.className].flat()
        : [];
      let lang;
      for (const name of childClassNames) {
        if (typeof name !== 'string') {
          continue;
        }
        if (name.startsWith('lang-')) {
          lang = name.slice(5);
          if (lang) {
            break;
          }
        }
        if (name.startsWith('language-')) {
          lang = name.slice(9);
          if (lang) {
            break;
          }
        }
      }
      // 代码高亮语言处理
      if (lang) {
        const m = hljsLangMap.find((m) => lang === m[0]);
        if (m && m[1]) {
          child.properties.className = [`lang-${m[1]}`, childClassNames].flat();
        }
      }
      // 代码块增加顶栏
      const headerNode = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['ele-md-body-code-toolbar']
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['ele-md-body-code-name']
            },
            children: [
              {
                type: 'text',
                value: lang ?? ''
              }
            ]
          },
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['ele-md-body-code-tool'],
              'data-action': 'copy',
              'data-text': locale.copy,
              'data-success-text': locale.copySuccess
            },
            children: [
              getIcon('M4 11H34V44H4ZM13 7V2H43V35H38M12 22 26 22M12 33 26 33')
            ]
          },
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['ele-md-body-code-tool'],
              'data-action': 'download',
              'data-text': locale.download
            },
            children: [getIcon('M24 6V32M33 23 24 32 15 23M6 24V42H42V24')]
          }
        ]
      };
      // 代码块包裹容器
      const bodyNode = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['ele-md-body-code-main']
        },
        children: [node]
      };
      const wrapperNode = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: [codeWrapperClass]
        },
        children: [headerNode, bodyNode]
      };
      // 代码下载后缀处理
      const sm = lang ? suffixMap.find((m) => lang === m[0]) : void 0;
      wrapperNode.properties['data-lang'] = sm?.[1] ?? lang;
      // 代码增加行号
      const text = toText(child, {
        whitespace: 'pre'
      });
      const lines = text.split('\n');
      if (lines.length > 1 && !lines[lines.length - 1].trim()) {
        lines.pop();
      }
      bodyNode.children.push({
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['ele-md-body-code-lines']
        },
        children: lines.map((_t, i) => ({
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['ele-md-body-code-no']
          },
          children: [
            {
              type: 'text',
              value: String(i + 1)
            }
          ]
        }))
      });
      // 图表处理
      if (lang === 'mermaid') {
        wrapperNode.properties.className.push('is-mermaid');
        wrapperNode.properties.className.push(mermaidShowClass);
        const id = `ele-mermaid-${uuid(8)}`;
        wrapperNode.properties['data-id'] = id;
        bodyNode.children.push({
          type: 'element',
          tagName: 'div',
          properties: {
            className: [codeMermaidClass]
          },
          children: []
        });
        headerNode.children[0] = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['ele-md-body-code-tabs']
          },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['ele-md-body-code-tab'],
                'data-action': 'tab',
                'data-tab': 'mermaid'
              },
              children: [
                {
                  type: 'text',
                  value: locale.mermaidTab
                }
              ]
            },
            {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['ele-md-body-code-tab'],
                'data-action': 'tab',
                'data-tab': 'code'
              },
              children: [
                {
                  type: 'text',
                  value: locale.codeTab
                }
              ]
            }
          ]
        };
        headerNode.children.push({
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['ele-md-body-code-tool'],
            'data-action': 'mermaidTheme',
            'data-text': locale.mermaidTheme,
            'data-theme': 'light'
          },
          children: [
            getIcon(
              'M24 2V6M8 8 11 11M2 24H6M8 40 11 37M24 46V42M40 40 37 37M46 24H42M40 8 37 11M24 35C30 35 35 30 35 24 35 18 30 13 24 13 18 13 13 18 13 24 13 30 18 35 24 35Z'
            )
          ]
        });
        headerNode.children.push({
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['ele-md-body-code-tool'],
            'data-action': 'zoomOut',
            'data-text': locale.zoomOut
          },
          children: [
            getIcon(
              'M16 23H30M36.3 36.3 45.5 45.5M23 42C33 42 42 33 42 23 42 13 33 4 23 4 13 4 4 13 4 23 4 33 13 42 23 42Z'
            )
          ]
        });
        headerNode.children.push({
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['ele-md-body-code-tool'],
            'data-action': 'zoomIn',
            'data-text': locale.zoomIn
          },
          children: [
            getIcon(
              'M16 23H30M23 16V30M36.3 36.3 45.5 45.5M23 42C33 42 42 33 42 23 42 13 33 4 23 4 13 4 4 13 4 23 4 33 13 42 23 42Z'
            )
          ]
        });
        headerNode.children.push({
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['ele-md-body-code-tool'],
            'data-action': 'viewer',
            'data-text': locale.viewer
          },
          children: [
            getIcon(
              'M8 8 19 19M8 15V8H15M40 8 29 19M40 15V8H33M41 41 29 29M41 34V41H34M8 40 19 29M8 33V40H15'
            )
          ]
        });
      }
      // 修改节点
      parent.children[index] = wrapperNode;
    });
  };
}

/**
 * 获取图标节点
 * @param path svg path
 */
function getIcon(path) {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      viewBox: '0 0 48 48',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '4',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round'
    },
    children: [
      {
        type: 'element',
        tagName: 'path',
        properties: { d: path },
        children: []
      }
    ]
  };
}

/**
 * 渲染图表
 * @param $wrapper 容器节点
 */
function renderMermaid($wrapper, theme) {
  const dataId = $wrapper.dataset.id;
  const $mermaid = $wrapper.querySelector(`.${codeMermaidClass}`);
  const $code = $wrapper.querySelector('pre>code');
  const code = $code ? $code.textContent : void 0;
  if (!dataId || !$mermaid || !code) {
    return;
  }
  mermaid.initialize({
    theme: theme ?? 'default'
  });
  mermaid
    .render(dataId, code, $mermaid)
    .then((result) => {
      $mermaid.innerHTML = result.svg;
      $wrapper.classList.add(mermaidRenderedClass);
      autoSizeMermaid($wrapper);
    })
    .catch((e) => {
      console.error(e);
    });
}

/**
 * 渲染所有图表
 * @param rootEl 根节点
 * @param check 是否只检查之前渲染失败的图表
 */
export function renderAllMermaid(rootEl, check) {
  if (!rootEl) {
    return;
  }
  Array.from(
    rootEl.querySelectorAll(`.${codeWrapperClass}.is-mermaid`)
  ).forEach(($wrapper) => {
    if (!check || !$wrapper.classList.contains(mermaidRenderedClass)) {
      renderMermaid($wrapper);
    }
  });
}

/**
 * 图表宽高适应到容器宽高
 * @param $wrapper 容器节点
 */
function autoSizeMermaid($wrapper) {
  const $mermaid = $wrapper.querySelector(`.${codeMermaidClass}`);
  const $svg = $wrapper.querySelector(`.${codeMermaidClass} svg`);
  if (!$mermaid || !$svg) {
    return;
  }
  const pw = $mermaid.clientWidth || 0;
  const ph = $mermaid.clientHeight || 0;
  const w = $svg.clientWidth || 1;
  const h = $svg.clientHeight || 1;
  const sw = pw / w;
  const sh = ph / h;
  const scale = Math.min(sw, sh) * 0.98;
  const size = Math.floor(w * scale);
  $svg.style.width = `${size}px`;
  $svg.style.maxWidth = `${size}px`;
  $svg.style.height = 'auto';
}

/**
 * 放大图表
 * @param $wrapper 容器节点
 */
function zoomInMermaid($wrapper) {
  const $mermaid = $wrapper.querySelector(`.${codeMermaidClass}`);
  const $svg = $wrapper.querySelector(`.${codeMermaidClass} svg`);
  if (!$mermaid || !$svg) {
    return;
  }
  const pw = $mermaid.clientWidth || 0;
  const w = $svg.clientWidth || 1;
  const size = w + 20;
  if (size < pw * 3) {
    $svg.style.width = `${size}px`;
    $svg.style.maxWidth = `${size}px`;
    $svg.style.height = 'auto';
  }
}

/**
 * 缩小图表
 * @param $wrapper 容器节点
 */
export function zoomOutMermaid($wrapper) {
  const $mermaid = $wrapper.querySelector(`.${codeMermaidClass}`);
  const $svg = $wrapper.querySelector(`.${codeMermaidClass} svg`);
  if (!$mermaid || !$svg) {
    return;
  }
  const w = $svg.clientWidth || 1;
  const size = w - 20;
  if (size > 50) {
    $svg.style.width = `${size}px`;
    $svg.style.maxWidth = `${size}px`;
    $svg.style.height = 'auto';
  }
}

/**
 * 处理工具按钮点击操作
 * @param $el 按钮节点
 * @param openImagePreview 打开图片预览方法
 */
export function handleAction($el, openImagePreview) {
  const action = $el.dataset.action;
  if (!action) {
    return;
  }
  const $wrapper =
    action === 'tab'
      ? $el.parentElement?.parentElement?.parentElement
      : $el.parentElement?.parentElement;
  if (!$wrapper) {
    return;
  }
  const $code = $wrapper.querySelector('pre>code');
  if (!$code) {
    return;
  }
  // 切换图表
  if (action === 'tab') {
    const tab = $el.dataset.tab;
    if (tab === 'mermaid') {
      $wrapper.classList.add(mermaidShowClass);
    } else {
      $wrapper.classList.remove(mermaidShowClass);
    }
    return;
  }
  // 放大图表
  if (action === 'zoomIn') {
    zoomInMermaid($wrapper);
    return;
  }
  // 缩小图表
  if (action === 'zoomOut') {
    zoomOutMermaid($wrapper);
    return;
  }
  // 切换图表主题
  if (action === 'mermaidTheme') {
    const theme = $el.dataset.theme;
    const toTheme = theme === 'light' ? 'dark' : void 0;
    renderMermaid($wrapper, toTheme);
    $el.setAttribute('data-theme', toTheme ?? 'light');
    return;
  }
  // 全屏查看图表
  if (action === 'viewer') {
    const svg = $wrapper.querySelector(`.${codeMermaidClass}>svg`)?.outerHTML;
    if (svg && openImagePreview) {
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      const $themeEl = $wrapper.querySelector(
        '.ele-md-body-code-tool[data-action="mermaidTheme"]'
      );
      const theme = $themeEl?.dataset?.theme;
      openImagePreview({
        urlList: [src],
        initialIndex: 0,
        customClass: `ele-mermaid-viewer${theme === 'dark' ? ' is-dark' : ''}`
      });
    }
    return;
  }
  // 下载代码
  const code = $code.textContent ?? '';
  if (action === 'download') {
    const suffix = $wrapper.dataset.lang ?? 'txt';
    download(code, `${Date.now()}.${suffix}`, 'text/plain;charset=utf-8');
    return;
  }
  // 复制代码
  if (action === 'copy') {
    copyText(code)
      .then(() => {
        $el.classList.add(copySuccessClass);
        setTimeout(() => {
          $el.classList.remove(copySuccessClass);
        }, 1000);
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
