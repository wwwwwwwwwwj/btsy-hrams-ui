import zh_Hans from 'bytemd/locales/zh_Hans.json';
import zh_Hant from 'bytemd/locales/zh_Hant.json';
import en from 'bytemd/locales/en.json';
import zh_HansGfm from '@bytemd/plugin-gfm/locales/zh_Hans.json';
import zh_HantGfm from '@bytemd/plugin-gfm/locales/zh_Hant.json';
import enGfm from '@bytemd/plugin-gfm/locales/en.json';
import {
  defaultLangs,
  rehypeEleMdProcess,
  renderAllMermaid,
  handleAction
} from '../ByteMdViewer/util';
export { handleAction };

/**
 * 国际化文案
 */
export const defaultEditorLangs = {
  zh_CN: {
    ...defaultLangs.zh_CN,
    class: '类图',
    er: '关系图',
    flowchart: '流程图',
    gantt: '甘特图',
    mermaid: 'Mermaid图表',
    mindmap: '思维导图',
    pie: '饼状图',
    sequence: '时序图',
    state: '状态图',
    timeline: '时间轴',
    uj: '旅程图',
    //
    bytemd: zh_Hans,
    bytemdGfm: zh_HansGfm,
    bytemdMath: {
      block: '块级公式',
      blockText: '公式',
      inline: '行内公式',
      inlineText: '公式'
    }
  },
  zh_TW: {
    ...defaultLangs.zh_TW,
    class: '類別圖',
    er: '實體關係圖',
    flowchart: '流程圖',
    gantt: '甘特圖',
    mermaid: 'Mermaid 圖表',
    mindmap: '心智圖',
    pie: '圓餅圖',
    sequence: '序列圖',
    state: '狀態圖',
    timeline: '時間軸',
    uj: '旅程圖',
    //
    bytemd: zh_Hant,
    bytemdGfm: zh_HantGfm,
    bytemdMath: {
      block: '塊級公式',
      blockText: '公式',
      inline: '內聯公式',
      inlineText: '公式'
    }
  },
  en: {
    ...defaultLangs.en,
    class: 'Class diagram',
    er: 'Entity relationship diagram',
    flowchart: 'Flow chart',
    gantt: 'Gantt chart',
    mermaid: 'Mermaid diagrams',
    mindmap: 'Mindmaps',
    pie: 'Pie chart',
    sequence: 'Sequence diagram',
    state: 'State diagram',
    timeline: 'Timeline',
    uj: 'User journey diagram',
    //
    bytemd: en,
    bytemdGfm: enGfm,
    bytemdMath: {
      block: 'Block formula',
      blockText: 'formula',
      inline: 'Inline formula',
      inlineText: 'formula'
    }
  }
};

/**
 * 支持代码工具栏, 图表插件, 超链接新窗口打开
 */
export function eleMdProcessEditor(option) {
  const locale = { ...defaultEditorLangs.zh_CN, ...(option?.locale || {}) };
  const opt = { ...(option || {}), locale };
  return {
    rehype: (processor) => processor.use(rehypeEleMdProcess, opt),
    actions: getActions(locale),
    viewerEffect: ({ markdownBody }) => {
      renderAllMermaid(markdownBody);
    }
  };
}

/**
 * 图标
 */
const icons = {
  ChartGraph:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 48 48"><path stroke="currentColor" stroke-linejoin="round" stroke-width="4" d="M17 6h14v9H17zM6 33h14v9H6zM28 33h14v9H28z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M24 16v8M13 33v-9h22v9"/></svg>'
};

/**
 * 获取编辑器操作菜单
 * @param locale 文案
 */
function getActionItems(locale) {
  return [
    {
      title: locale.flowchart,
      code: `graph TD
Start --> Stop`
    },
    {
      title: locale.sequence,
      code: `sequenceDiagram
  Alice ->> John: Hello John, how are you?
  John -->> Alice: Great!
  Alice -) John: See you later!`
    },
    {
      title: locale.class,
      code: `classDiagram
  Animal <|-- Duck
  Animal <|-- Fish
  Animal <|-- Zebra
  Animal : +int age
  Animal : +String gender
  Animal: +isMammal()
  Animal: +mate()

  class Duck{
    +String beakColor
    +swim()
    +quack()
  }

  class Fish{
    -int sizeInFeet
    -canEat()
  }

  class Zebra{
    +bool is_wild
    +run()
  }`
    },
    {
      title: locale.state,
      code: `stateDiagram-v2
  [*] --> Still
  Still --> [*]

  Still --> Moving
  Moving --> Still
  Moving --> Crash
  Crash --> [*]`
    },
    {
      title: locale.er,
      code: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
    },
    {
      title: locale.uj,
      code: `journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me
    Do work: 1: Me, Cat
  section Go home
    Go downstairs: 5: Me
    Sit down: 5: Me`
    },
    {
      title: locale.gantt,
      code: `gantt
  title A Gantt Diagram
  dateFormat  YYYY-MM-DD
  section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
  section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`
    },
    {
      title: locale.pie,
      code: `pie title Pets adopted by volunteers
  "Dogs" : 386
  "Cats" : 85
  "Rats" : 15`
    },
    {
      title: locale.mindmap,
      code: `mindmap
  Root
    A
      B
      C
    `
    },
    {
      title: locale.timeline,
      code: `timeline
  title History of Social Media Platform
  2002 : LinkedIn
  2004 : Facebook
       : Google
  2005 : Youtube
  2006 : Twitter
      `
    }
  ];
}

/**
 * 获取编辑器操作按钮
 * @param locale 文案
 */
function getActions(locale) {
  return [
    {
      title: locale.mermaid,
      icon: icons.ChartGraph,
      cheatsheet: '```mermaid',
      handler: {
        type: 'dropdown',
        actions: getActionItems(locale).map(({ title, code }) => ({
          title,
          handler: {
            type: 'action',
            click({ editor, appendBlock, codemirror }) {
              const { line } = appendBlock('```mermaid\n' + code + '\n```');
              editor.setSelection(
                codemirror.Pos(line + 1, 0),
                codemirror.Pos(line + code.split('\n').length)
              );
              editor.focus();
            }
          }
        }))
      }
    }
  ];
}
