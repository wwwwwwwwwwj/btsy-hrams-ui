# HRAMS 前端界面与体验优化计划

> 目标：统一 V2 视觉、理顺首页与导航、减少重复实现、补强看板与复杂页体验、完善校验与工程约束。  
> 范围：`btsy-hrams-ui`（不改后端契约，除非发现字段不一致需对齐）。  
> 原则：分阶段交付，每阶段可独立合并；优先「体感大、改动集中」项。

---

## 阶段 0：基线与约定（0.5 天）

### 0.1 统一页面壳规范

- 业务页标准结构（与现有人员/档案页一致）：
  - 外层：`ele-page` + `hide-footer`（列表页加 `flex-table="auto"`）
  - 内容：`div.hrams-v2-page` → `hrams-v2-header`（标题 + 描述 + 操作）→ `hrams-v2-card`（筛选 / 表格或主体）
  - 样式：`import '../styles/v2.scss'`（相对路径按目录调整）
- 列表页筛选区使用 `hrams-v2-filter`，表格区使用 `hrams-v2-table-card` + `ele-pro-table`（与现有 CRUD 页一致）。

### 0.2 验收清单（全阶段共用）

- [ ] 登录后默认进入档案业务首页（见阶段 1）
- [ ] `npm run verify:hrams` 通过
- [ ] `npm run test:e2e:smoke` / `test:e2e:menu` 通过（按需更新断言）
- [ ] 肉眼：HRAMS 菜单下无「灰底圆角页」与「白底 ele-card 页」混搭

---

## 阶段 1：首页与导航（1 天）

### 1.1 默认首页改为统计看板

| 项 | 说明 |
|----|------|
| 改 `src/config/setting.js` | `HOME_PATH` 从 `/index` 改为 `/workbench/dashboard`（或 `HRAMS_WORKBENCH_DASHBOARD` 常量引用） |
| 兼容 | `src/router/routes.js` 已有 `/dashboard` → `/index` 等重定向；评估是否增加 `/index` → `/workbench/dashboard` 重定向，避免书签失效 |
| 登录跳转 | 检查 `src/views/login/index.vue` 及 `use-page-tab.js` 中 `getHomePath()` 行为 |

### 1.2 模板工作台处理（二选一，建议 A）

- **A（推荐）**：保留 `/index` 路由但侧栏隐藏；仅管理员或「系统」下可进（若菜单本无入口则仅直链可访问）。
- **B**：删除或替换 `src/views/index/index.vue` 为简易跳转页，减少维护成本。

### 1.3 E2E

- 更新 `e2e/smoke/p0-routes.js`（若登录后期望路径变化）
- 增加断言：登录后 URL 含 `workbench/dashboard`

**阶段 1 完成标准**：新用户登录第一眼为统计看板，页签标题与产品名一致。

---

## 阶段 2：V2 皮肤全覆盖（2～3 天）

将仍使用 `ele-card` 的 HRAMS 页迁移到 V2 壳（仅改布局与样式，不改业务逻辑）。

### 2.1 待迁移页面清单

| 页面 | 文件 | 建议标题/描述 |
|------|------|----------------|
| 提醒规则 | `hrams/remind/rules/index.vue` | 提醒规则 / 到期扫描配置 |
| 提醒记录 | `hrams/remind/records/index.vue` | 提醒记录 |
| 数据备份 | `hrams/backup/index.vue` | 数据备份 |
| 上传批次 | `hrams/material/batch/index.vue` | 上传批次 |
| 材料分类 | `hrams/material/category/index.vue` | 材料分类 |
| 字段配置 | `hrams/person/field-config/index.vue` | 人员扩展字段 |
| 全文检索 | `hrams/query/fulltext/index.vue` | 全文检索 |
| 智能问答 | `hrams/query/qa/index.vue` | 智能问答 |
| 索引管理 | `hrams/query/reindex/index.vue` | 搜索索引 |

已 V2 的页面（仅做回归）：看板、人员、档案、综合查询、材料维护、挂接、调阅、操作日志。

### 2.2 实施方式

- 每页按 0.1 结构改 template；`script` 尽量不动。
- 子组件（如 `material-maintain-panel`）已部分引用 v2 类名，本阶段不强制拆组件。
- 调阅页 `utilize/index.vue`：菜单拆三项时保持 `singleMode` 逻辑，统一 `page-head` 与 V2 标题字号（与 `hrams-v2-title` 对齐）。

### 2.3 可选：全局引入 v2

- 若重复 `import v2.scss` 过多，可评估在 `layout` 或 HRAMS 父路由 wrapper 引入一次；**注意**避免污染系统管理页，优先保持「按页 import」直至确认无副作用。

**阶段 2 完成标准**：上表 9 个页面视觉与人员管理页同级；无 inline `style="margin-top:12px"` 主导布局（可保留局部）。

---

## 阶段 3：检索条件复用（1.5～2 天）

### 3.1 问题

`person/index.vue`、`archive/index.vue`、`query/index.vue` 筛选字段高度重叠，且存在细微差异（如出生「日」vs「月」、字典组件 vs `el-select`）。

### 3.2 方案

1. 新增 `src/views/hrams/composables/use-person-archive-search.js`（或 `components/person-archive-search-form.vue`）：
   - 定义共享字段：`archiveNo, name, idCard, gender, birthDate, age, nation, politicalStatus, education, personStatus`
   - 扩展槽位：`integrityStatus, archiveStatus`（档案/综合查询用）
   - 统一字典：`useDictData` + `DictData` 组件，与人员页一致
2. **出生日期**：产品确认统一为「日」或「月」；三处同步（建议与人员录入一致为 `type="date"`）。
3. 各页保留自己的 `reload` / `datasource`，仅替换表单区块。

### 3.3 测试

- 手工：三页同条件查询结果一致（在各自接口语义允许范围内）
- 单测可选：对 `buildWhere(params)` 纯函数做快照（非必须）

**阶段 3 完成标准**：筛选 UI 与字段源一致；改字典/字段只改一处。

---

## 阶段 4：看板图表与性能小修（0.5～1 天）

### 4.1 `hrams/dashboard/index.vue`

- `onMounted` 后 `renderCharts` 保留
- 增加 `onBeforeUnmount`：`chart.dispose()`
- 增加 `resize`：`window.addEventListener('resize', ...)` 或 `ResizeObserver` 调 `chart.resize()`
- 数据为空时：图表区展示 empty 文案，避免空白轴

### 4.2 调阅统计子面板

- 若 `utilize-stats-panel.vue` 使用 ECharts，同样 dispose/resize

**阶段 4 完成标准**：反复切换菜单/缩放窗口，图表不错位、控制台无泄漏警告。

---

## 阶段 5：复杂页体验（1～2 天）

### 5.1 材料维护 `archive/material/index.vue`

- 未选人时：`material-person-pick` 增加简短步骤说明（1. 选择干部 → 2. 维护分类材料）
- 上传/挂接失败：沿用现有 `EleMessage`，检查是否需展示批次号链接到「上传批次」
- 只读模式：从综合查询进入时，头部明确「只读查阅」标识（若已有 `readOnly`，补文案）

### 5.2 材料挂接 `archive/attach/index.vue`

- 批量/增补模式：在 header 用 `hrams-v2-desc` 写清差异（与档案列表按钮文案一致）

### 5.3 智能问答 `query/qa/index.vue`（轻量增强）

- 提问中：`loading` 防重复提交
- 回答区：保留 `source`；错误时展示接口 message
- 示例问题保持；**不做**完整聊天会话（留阶段 6 可选）

**阶段 5 完成标准**：主链路（人员 → 材料 → 挂接 → 调阅）每步有可见引导，无新增后端接口。

---

## 阶段 6：工程与菜单一致性（0.5 天）

### 6.1 `verify:hrams` 与菜单表对齐

- `e2e/smoke/hrams-menu-routes.js` 增加：
  - `{ title: '字段配置', path: '...', component: 'hrams/person/field-config/index' }`（path 与 `script/sql/hrams_mysql.sql` 一致）
- 文档注释：调阅三路由共用 `hrams/utilize/index` + `query.tab`

### 6.2 E2E 增强（可选）

- P0 路由增加字段配置、全文、索引任一项抽样
- 迁移 V2 后断言可优先 `.hrams-v2-page`

### 6.3 包体（低优先级，单独 PR）

- 盘点未使用路由：`ai/chat`、地图等是否在菜单暴露
- Vite `manualChunks` 或路由级 lazy（已默认）；仅当构建体积成为问题时再做

---

## 阶段 7（可选）：智能问答与全文深化

依赖产品与后端能力，不阻塞前 6 阶段。

- 问答：多轮上下文、引用人员/材料链接
- 全文：高亮 snippet、跳转材料预览
- 与综合查询：从结果行「去问档案」带 `personId` 预填

---

## 推荐实施顺序与工期

| 顺序 | 阶段 | 预估 | 依赖 |
|------|------|------|------|
| 1 | 阶段 1 首页 | 1d | - |
| 2 | 阶段 2 V2 全覆盖 | 2～3d | - |
| 3 | 阶段 4 看板图表 | 0.5～1d | 可与 2 并行 |
| 4 | 阶段 3 检索复用 | 1.5～2d | 阶段 2 后改表单更省事 |
| 5 | 阶段 5 复杂页体验 | 1～2d | 阶段 2 |
| 6 | 阶段 6 工程校验 | 0.5d | 全程 |
| 7 | 阶段 7 可选 | TBD | 产品确认 |

**合计（不含阶段 7）**：约 **6～9 个工作日**。

---

## 风险与注意事项

1. **HOME_PATH 变更**：若后端菜单第一项不是看板，动态 `redirect` 可能覆盖 `HOME_PATH`；需在 `getMenuRoutes` / 登录后跳转逻辑中确认优先级。
2. **权限**：V2 壳迁移不得删除 `v-permission` 与按钮级权限。
3. **出生日期统一**：需业务确认后再改综合查询，避免与历史导出/接口格式冲突。
4. **不编译原则**：开发自测以 `verify:hrams`、E2E、本地 `dev` 肉眼为准（与团队约定一致）。

---

## 执行方式（给实施者）

1. 按阶段开分支，例如 `feat/hrams-ui-home`、`feat/hrams-ui-v2-skin`。
2. 每阶段 PR 附：截图对比（改前/改后 1～2 张）、`verify:hrams` 结果。
3. 全部阶段完成后，更新本文件各 checkbox 为已完成，并注明完成日期。

---

## 任务分解（Issue 级）

- [ ] P1-01 修改 `HOME_PATH` 与 `/index` 重定向
- [ ] P1-02 登录/E2E 跟随首页调整
- [ ] P2-01～P2-09 九个页面 V2 迁移（可拆 9 个 PR 或 1 个）
- [ ] P3-01 抽取人员/档案检索表单
- [ ] P3-02 三页接入并统一出生日期
- [ ] P4-01 看板 ECharts 生命周期
- [ ] P5-01 材料维护/挂接引导文案
- [ ] P5-02 问答 loading 与错误展示
- [ ] P6-01 `hrams-menu-routes` 补全字段配置
- [ ] P6-02 文档与 E2E 断言更新
