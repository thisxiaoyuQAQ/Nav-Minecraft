# 小型文章管理系统设计

## 背景

MCNAV 当前是一个 Vite + React + TypeScript 静态导航站。导航数据维护在 `content/categories/*.md` 的 YAML frontmatter 中，首页负责渲染分类、搜索与资源卡片。用户希望增加一个小型文章系统，让导航卡片可以直接导向站内文章页面；文章不需要在前台展示列表或管理界面，只需要在后台通过 `content/posts/` 目录编写 Markdown 文件维护。

## 目标

- 新增 `content/posts/*.md` 作为文章源目录。
- 每个 Markdown 文件生成一个站内文章页面，路径为 `/posts/<slug>`。
- 分类导航中的链接可以直接写 `url: /posts/<slug>` 导向内部文章。
- 外部链接行为保持不变，继续新开标签页。
- 文章页面沿用现有 MCNAV 视觉风格和深浅主题变量。
- 不引入数据库、登录后台或完整 CMS。
- 不新增前台文章列表入口。

## 非目标

- 不做在线编辑、登录、权限管理或评论系统。
- 不做文章分类页、归档页、全文搜索或目录生成。
- 不支持复杂 Markdown 扩展，例如表格、脚注、MDX、嵌入 HTML。
- 不引入 React Router，先用轻量 History API 满足当前需求。

## 文件结构

新增文件建议如下：

```text
content/posts/
  server-core-guide.md
src/
  postTypes.ts
  parseMarkdownPost.ts
  postData.ts
```

现有文件需要调整：

```text
src/main.tsx
src/App.tsx
src/App.css
src/App.test.tsx
```

并新增对应测试：

```text
src/parseMarkdownPost.test.ts
src/contentPosts.test.ts
```

## 文章文件格式

文章文件使用轻量 frontmatter。frontmatter 可选，但推荐填写：

```markdown
---
title: 服务端核心选择指南
description: Paper、Folia、Forge、Fabric、混合端该怎么选。
date: 2026-07-03
tags: [server, guide]
---

# 服务端核心选择指南

正文内容。
```

字段规则：

- `title` 可选。优先使用 frontmatter 的 `title`；如果没有，读取正文第一个 H1；如果仍没有，使用 slug。
- `description` 可选。存在时展示在文章标题下方。
- `date` 可选。存在时展示在文章元信息区域。
- `tags` 可选。存在时展示为标签。
- 正文按常规 Markdown 渲染。

## 数据模型

新增文章类型：

```ts
export interface ArticlePost {
  slug: string
  title: string
  description?: string
  date?: string
  tags: string[]
  body: string
}
```

`slug` 来自文件名。例如 `content/posts/server-core-guide.md` 对应 `server-core-guide`。

## 数据加载与解析

`postData.ts` 使用与现有分类数据相同的模式读取文章：

```ts
import.meta.glob('../content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})
```

加载后按文件名排序，并调用 `parseMarkdownPost(markdown, slug)` 解析。

`parseMarkdownPost.ts` 负责：

1. 解析可选 YAML frontmatter。
2. 拆分 frontmatter 与正文。
3. 读取 `title`、`description`、`date`、`tags`。
4. 在缺少 `title` 时从正文第一个 H1 提取标题。
5. 返回 `ArticlePost`。

如果 frontmatter 存在但 YAML 格式错误，解析应抛出错误，让测试或构建尽早暴露内容问题。

## 路由设计

不引入 React Router。`App` 维护当前路径状态：

- 初始化时读取 `window.location.pathname`。
- 监听 `popstate` 支持浏览器前进/后退。
- 通过小型导航函数执行 `history.pushState` 并更新路径状态。

渲染规则：

- `/` 或空路径：渲染现有导航首页。
- `/posts/<slug>`：查找对应文章并渲染文章详情页。
- `/posts/<unknown>`：渲染文章未找到页面。
- 其他未知路径：渲染轻量未找到页面，并提供返回首页。

## 导航卡片行为

`NavCard` 根据 `link.url` 判断链接类型：

- 外部链接：保持当前行为，渲染 `<a target="_blank" rel="noreferrer">`，箭头仍显示外链语义。
- 内部文章链接：识别 `/posts/` 开头的 URL，点击时阻止默认跳转，调用内部导航函数进入文章页；不设置 `target`，箭头可以使用站内语义或保留简洁箭头。

分类 Markdown 示例：

```yaml
- title: 服务端核心选择指南
  url: /posts/server-core-guide
  description: 帮助新服主选择 Paper、Folia、Forge、Fabric 等核心。
  tags: [guide, server]
```

## 文章页面 UI

文章页继续使用现有 `app-shell`、`topbar`、玻璃面板、绿色强调色和主题变量。页面包含：

- 顶部品牌与主题切换。
- “返回导航首页”按钮。
- 文章标题。
- 可选描述。
- 可选日期和标签。
- Markdown 正文内容。

文章页不显示分类侧边栏，避免导航内容与文章阅读区域抢空间。移动端继续使用现有响应式断点风格。

## Markdown 渲染范围

实现一个轻量、受控的 Markdown 渲染器，支持：

- H1 / H2 / H3 标题。
- 段落。
- 粗体、斜体、行内代码。
- 有序列表和无序列表。
- 引用块。
- fenced code block。
- Markdown 链接。

暂不支持嵌入 HTML，渲染时应对文本内容进行 React 默认转义，避免直接注入 HTML。

## 错误处理

- `content/posts/` 为空：导航首页正常工作。
- 访问不存在的 `/posts/<slug>`：显示“文章不存在”，并提供返回首页按钮。
- 导航里写了 `/posts/<slug>` 但文章不存在：点击后进入文章不存在页面。
- frontmatter YAML 错误：解析抛错，由测试或构建失败暴露。
- 缺少标题：使用 H1 或 slug 兜底。

## 测试计划

### Markdown 解析测试

覆盖：

- 能解析 frontmatter、正文和 tags。
- 无 frontmatter 时也能解析正文。
- 缺少 `title` 时使用第一个 H1。
- 没有 `title` 和 H1 时使用 slug。
- frontmatter YAML 错误时抛错。

### App 路由测试

覆盖：

- `/` 渲染导航首页。
- 点击 `/posts/<slug>` 导航卡片后渲染文章页。
- 外部链接仍然带 `target="_blank"`。
- 返回首页按钮恢复导航首页。
- 浏览器 `popstate` 能切换页面状态。
- 不存在文章显示未找到页面。

### 内容集成测试

覆盖：

- `content/posts/*.md` 都能被解析。
- `content/categories/*.md` 中所有 `/posts/<slug>` 链接都有对应文章文件。

## 实施顺序

1. 添加文章类型、解析器和测试。
2. 添加文章数据加载与内容集成测试。
3. 调整 `main.tsx` 向 `App` 传入文章数据。
4. 扩展 `App` 的轻量路由、内部导航和文章页组件。
5. 添加文章页与 Markdown 渲染样式。
6. 新增一篇示例文章，并在分类数据中加入一个内部文章链接。
7. 运行测试和构建验证。

## 验收标准

- 在 `content/posts/example.md` 新增文章后，可通过 `/posts/example` 访问。
- 分类链接写 `url: /posts/example` 时，点击卡片在站内打开文章页。
- 外部资源链接仍然新开标签页。
- 文章不存在时有清晰提示和返回首页入口。
- `npm run test -- --run` 通过。
- `npm run build` 通过。
