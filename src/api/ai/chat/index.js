/**
 * 获取对话列表
 */
export async function getConversations() {
  const data = [
    {
      conversationId: 4,
      label: 'EleAdminPlus可以做什么?',
      isPinned: true
    },
    {
      conversationId: 3,
      label: '如何快速安装和导入组件?'
    },
    {
      conversationId: 2,
      label: 'EleAdminPlus新增了哪些组件?'
    },
    {
      conversationId: 1,
      label: 'EleAdminPlus最近有哪些升级?'
    }
  ];
  return data;
}

/**
 * 删除对话
 * @param conversationId 对话 id
 */
export async function removeConversation(conversationId) {
  console.log('conversationId:', conversationId);
  return '删除成功';
}

/**
 * 重命名对话
 * @param conversationId 对话 id
 * @param name 新的名称
 */
export async function renameConversation(conversationId, name) {
  console.log('conversationId:', conversationId, '  name:', name);
  return '重命名成功';
}

/**
 * 置顶对话
 * @param conversationId 对话 id
 */
export async function pinConversation(conversationId) {
  console.log('conversationId:', conversationId);
  return '置顶成功';
}

/**
 * 取消置顶对话
 * @param conversationId 对话 id
 */
export async function unpinConversation(conversationId) {
  console.log('conversationId:', conversationId);
  return '取消置顶成功';
}

/**
 * 获取对话消息记录
 * @param conversationId 对话 id
 */
export async function getMessages(conversationId) {
  console.log('conversationId:', conversationId);
  if (conversationId === 3) {
    const data = [
      {
        messageId: 1,
        role: 'user',
        content: '如何快速安装和导入组件?'
      },
      {
        messageId: 2,
        parentMessageId: 1,
        role: 'assistant',
        reasoning:
          '用户问我“如何快速安装和导入组件”，我需要先查看项目使用的技术栈，再到开发文档中找到相对应的操作说明，并告诉给用户',
        content:
          '你需要先执行命令 `npm i ele-admin-plus -s` 安装 `EleAdminPlus` 组件库依赖，再到 `src/main.ts` 中使用 `app.use(EleAdminPlus);` 全局安装后就可以使用组件了。'
      },
      {
        messageId: 3,
        parentMessageId: 2,
        role: 'user',
        content: '安装时遇到这个错误信息，如何解决?',
        files: [
          {
            key: 1,
            name: 'ttkIjNPlVDuv4lUTvRX8GIlM2QqSe0jg.jpg',
            description: 'jpg  29.25KB',
            url: 'https://cdn.eleadmin.com/20200610/ttkIjNPlVDuv4lUTvRX8GIlM2QqSe0jg.jpg'
          },
          {
            key: 2,
            name: 'CyrCNmTJfv7D6GFAg39bjT3eRkkRm5dI.jpg',
            description: 'jpg  38.63KB',
            url: 'https://cdn.eleadmin.com/20200610/CyrCNmTJfv7D6GFAg39bjT3eRkkRm5dI.jpg'
          },
          {
            key: 3,
            name: 'WLXm7gp1EbLDtvVQgkeQeyq5OtDm00Jd.jpg',
            description: 'jpg  58.95KB',
            url: 'https://cdn.eleadmin.com/20200610/WLXm7gp1EbLDtvVQgkeQeyq5OtDm00Jd.jpg'
          }
        ]
      },
      {
        messageId: 4,
        parentMessageId: 3,
        role: 'assistant',
        reasoning:
          '用户安装时遇到了错误，并发来 3 张带有错误信息的图片，这看起来像是 nodejs 的错误，我需要先查看文档中对 nodejs 的版本要求，对比用户使用的版本是否和文档中要求的一致',
        content:
          '这个错误信息表示你使用的 nodejs 版本为 v16.13.1 ，而 `vue@3.2.26` 最低要求的 nodejs 版本为 v18.0.0 ，要解决这个问题，需要升级你的 nodejs 版本。'
      }
    ];
    return data;
  }
  if (conversationId === 4) {
    const data = [
      {
        messageId: 1,
        role: 'user',
        content: 'EleAdminPlus 可以做什么?'
      },
      {
        messageId: 2,
        parentMessageId: 1,
        role: 'assistant',
        reasoning:
          '用户问我 “EleAdminPlus 可以做什么” ，我需要去查看 EleAdminPlus 官网中的介绍信息，总结提炼后告诉给用户',
        content:
          'EleAdminPlus 是一个前端开发框架，如果你需要开发后台管理系统，使用 EleAdminPlus 框架可以帮你节约很多开发时间。'
      },
      {
        messageId: 3,
        parentMessageId: 1,
        role: 'assistant',
        reasoning:
          '用户想知道 EleAdminPlus 可以做什么，说明用户是第一次了解到这个框架，我需要为用户详细的介绍 EleAdminPlus 框架具有的功能',
        content:
          'EleAdminPlus 提供了很多实用的扩展组件，开箱即用，能节约大量开发时间，支持切换多种布局效果，基本满足各种常见系统的需求，并内置多套主题，实现一键换肤。'
      },
      {
        messageId: 4,
        parentMessageId: 3,
        role: 'user',
        content: 'EleAdminPlus 功能多吗?'
      },
      {
        messageId: 5,
        parentMessageId: 4,
        role: 'assistant',
        reasoning:
          '用户想了解 EleAdminPlus 的功能是否丰富，说明用户对框架的功能比较看重，我需要为用户整理一份详细的功能列表',
        content:
          'EleAdminPlus 的扩展组件有 70+ ，可切换十几种常用布局，还可以自由切换每个布局配置项，这些布局配置的自由组合能达到一百多种不同效果，内置 7 套主题可一键换肤，还支持自定义皮肤，综上来看 EleAdminPlus 的功能是非常丰富的。'
      },
      {
        messageId: 6,
        parentMessageId: 3,
        role: 'user',
        content: 'EleAdminPlus 好用吗?'
      },
      {
        messageId: 7,
        parentMessageId: 6,
        role: 'assistant',
        reasoning:
          '用户问我 “EleAdminPlus 好用吗” ，我需要收集用户的真实体验，我先看看用户群的聊天记录，收集用户的反馈总结后发给用户',
        content:
          '根据用户的真实体验来看，EleAdminPlus 不仅组件数量多，每个组件的属性、插槽、事件等都设计灵活，不仅可以做到开箱即用，还能很方便的进行自定义扩展，非常好用。'
      }
    ];
    return data;
  }
  const data = [
    {
      messageId: 1,
      role: 'user',
      content: '你好~'
    },
    {
      messageId: 2,
      parentMessageId: 1,
      role: 'assistant',
      reasoning: '用户发来消息“你好”，我应该用友好和亲切的语气表达欢迎和问候。',
      content: '您好！很高兴见到您呢！有什么可以帮助您的吗？'
    }
  ];
  return data;
}

/**
 * 获取模型列表
 */
export async function getModels() {
  const data = [
    { name: 'DeepSeek-R1-250528', id: 'deepseek-r1-250528' },
    { name: 'DeepSeek-V3.1-250821', id: 'deepseek-v3.1-250821' },
    { name: 'ERNIE-4.5-Turbo-32K', id: 'ernie-4.5-turbo-32k' },
    { name: 'ERNIE-4.5-Turbo-128K', id: 'ernie-4.5-turbo-128k' },
    { name: 'ERNIE-4.5-Turbo-VL', id: 'ernie-4.5-turbo-vl' }
  ];
  return data;
}

/**
 * 获取提示列表
 */
export async function getPrompts() {
  const data = [
    { label: '🎉 EleAdminPlus 最近有哪些升级？' },
    { label: '🌟 EleAdminPlus 新增了哪些组件？' },
    { label: '✨ EleAdminPlus 可以做什么？' },
    { label: '🛠️ 如何快速安装和导入组件？' }
  ];
  return data;
}
