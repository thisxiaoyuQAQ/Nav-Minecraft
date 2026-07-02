# MCNAV React + Markdown 静态导航站改造设计

日期：2026-07-02

## 1. 背景与目标

当前仓库根目录用于承载新的 MCNAV React 静态导航站。`wwwroot/` 是旧的 PHP / TwoNav 站点源码，只作为视觉、内容和历史结构参考，不在本次改造中修改。

本次目标是在仓库根目录重建一个 Vite + React + TypeScript 导航页项目，并使用 Markdown/YAML 作为可直接编辑的数据源。初始链接数据来自 `TwoNav_bookmarks_20260702_171148.html`。

核心目标：

- 品牌统一为 `MCNAV`。
- UI 采用 `Apple Clean + Minecraft Accent`。
- 删除旧站右上角的“管理记录”/后台管理入口概念。
- 保留轻量的 React + Markdown 数据架构。
- 支持可靠的链接图标显示策略。
- 批量生成并清理 `content/categories/*.md` 的分类描述和链接描述。
- 根目录可直接运行 `npm install`、`npm run dev`、`npm run build`。

## 2. 项目边界

### 2.1 本次包含

- 在仓库根目录创建 React/Vite 项目结构。
- 建立 `content/categories/*.md` 数据目录。
- 从 `TwoNav_bookmarks_20260702_171148.html` 导入初始分类和链接。
- 实现首页、侧边分类导航、搜索、分类区块、链接卡片。
- 实现白天/黑夜/跟随系统主题。
- 实现 favicon 与 fallback 图标策略。
- 添加测试覆盖核心行为。

### 2.2 本次不包含

- 不修改 `wwwroot/` 旧 PHP 站点。
- 不接入 PHP、SQLite、MySQL 或 TwoNav 后台。
- 不实现登录、权限、后台管理、拖拽排序。
- 不实现在线编辑 Markdown。
- 不实现复杂动画或部署流水线。

## 3. 目标目录结构

```text
E:/Code/html/mcnav
├─ package.json
├─ index.html
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ App.css
│  ├─ navTypes.ts
│  ├─ navData.ts
│  ├─ parseMarkdownNav.ts
│  ├─ App.test.tsx
│  ├─ parseMarkdownNav.test.ts
│  ├─ contentCategories.test.ts
│  └─ test/
│     └─ setup.ts
├─ content/
│  └─ categories/
│     ├─ 01-announcements.md
│     ├─ 02-ads.md
│     ├─ 04-server-core.md
│     ├─ 05-wiki.md
│     ├─ 06-dev-docs.md
│     ├─ 07-tools.md
│     ├─ 08-community-forums.md
│     ├─ 09-contact.md
│     ├─ 10-friend-links.md
│     ├─ 11-paid-plugins-cn.md
│     ├─ 12-private-collection.md
│     └─ 13-plugin-recommendations.md
├─ docs/superpowers/specs/
│  └─ 2026-07-02-mcnav-redesign-design.md
├─ TwoNav_bookmarks_20260702_171148.html
└─ wwwroot/
```

`wwwroot/` 保留为旧站源码和参考资料，不参与新 React 应用运行时。

## 4. 数据模型

### 4.1 类型

```ts
export interface NavLink {
  title: string
  url: string
  description: string
  icon?: string
  tags: string[]
}

export interface NavCategory {
  id: string
  name: string
  icon: string
  description: string
  links: NavLink[]
}
```

### 4.2 Markdown 格式

每个分类一个 Markdown 文件，数据写在 YAML frontmatter 中：

```md
---
id: server-core
name: 服务端核心
icon: 🧱
description: Paper、Folia、Velocity、Forge、Fabric 等服务端核心与代理端入口。
links:
  - title: Paper
    url: https://papermc.io/downloads/paper
    description: 高性能 Minecraft 服务端核心，适合 Bukkit/Spigot 插件生态。
    tags: [server, core, paper]
---
```

运行时只读取 frontmatter。正文可以为空，也可以用于维护备注，但不参与首页渲染。

### 4.3 数据加载

`src/navData.ts` 使用 Vite 的 `import.meta.glob` 读取：

```ts
import.meta.glob('../content/categories/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})
```

加载后按文件名排序，再交给 `parseMarkdownCategory(markdown, fallbackId)` 解析为 `NavCategory[]`。

## 5. 初始书签导入

初始数据来自：

```text
E:/Code/html/mcnav/TwoNav_bookmarks_20260702_171148.html
```

该文件是 Netscape Bookmark HTML 格式。导入时按一级目录生成分类 Markdown。

### 5.1 分类映射

- `站点公告` → `01-announcements.md`，图标 `📣`
- `广告位` → `02-ads.md`，图标 `📢`
- `最近热门` → 如果为空则不生成分类文件
- `服务端核心` → `04-server-core.md`，图标 `🧱`
- `wiki` → `05-wiki.md`，图标 `📚`
- `开发文档` → `06-dev-docs.md`，图标 `⚙️`
- `工具` → `07-tools.md`，图标 `🧰`
- `社区/论坛` → `08-community-forums.md`，图标 `💬`
- `联系站长` → `09-contact.md`，图标 `📮`
- `友情链接` → `10-friend-links.md`，图标 `🔗`
- `国产付费插件` → `11-paid-plugins-cn.md`，图标 `💎`
- `私人收藏` → `12-private-collection.md`，图标 `⭐`
- `插件推荐` → `13-plugin-recommendations.md`，图标 `✨`

### 5.2 描述生成规则

分类描述使用人工整理后的稳定文案，不使用“由 TwoNav 导入”等机械文本。

链接描述规则：

1. 对常见站点和语义明确的标题写具体说明。
2. 对无法可靠判断用途的链接使用中性描述，例如“访问 Paper 官方页面”。
3. 不编造功能、价格、开源状态或兼容版本。
4. 保留原始标题和 URL，不因文案清理而改动链接目标。

## 6. 页面与交互设计

### 6.1 视觉方向

采用 `Apple Clean + Minecraft Accent`：

- Apple Clean：大留白、圆角玻璃面板、柔和阴影、清晰层级、高级灰/白背景。
- Minecraft Accent：MCNAV 品牌、草方块绿色、轻量方块网格纹理、少量像素块和工具/方块语义点缀。
- 不做重像素风，不让整体变成低龄卡通风。

### 6.2 页面布局

页面由以下区域组成：

1. 左侧分类导航：显示 MCNAV 品牌、分类入口和链接数量。
2. 主内容顶部：显示站点说明、主题切换按钮；不显示“管理记录”。
3. Hero 区域：强化 MCNAV 定位。
4. 搜索区：本地过滤分类内链接。
5. 分类内容区：按分类渲染链接卡片。

Hero 文案：

- 标题：`方块世界的高效入口`
- 副标题：`收集服务端核心、插件 Wiki、开发文档、工具与社区资源。`
- 标签：`Server Core`、`Plugin Wiki`、`Dev Docs`、`Tools`

搜索 placeholder：

```text
搜索核心、插件、Wiki、工具或服务器资源
```

### 6.3 响应式

- 桌面端：左侧固定/粘性侧边栏 + 右侧内容区。
- 平板端：侧边栏收窄，卡片网格减少列数。
- 移动端：顶部品牌区 + 横向/折叠分类导航，卡片单列或双列。

## 7. 主题设计

支持三种主题状态：

- `system`：跟随系统 `prefers-color-scheme`。
- `light`：白天模式。
- `dark`：黑夜模式。

默认使用 `system`。用户点击右上角主题按钮后，状态保存到 `localStorage`。

主题按钮第一版使用单按钮循环：

```text
跟随系统 → 白天 → 黑夜 → 跟随系统
```

CSS 使用变量管理颜色、边框、阴影和背景，不维护两套页面结构。

## 8. 图标策略

链接图标使用三层 fallback：

1. Markdown 中写了 `icon` 时，优先显示该值。
2. 未写 `icon` 时，根据 URL 域名生成 favicon：

   ```text
   https://www.google.com/s2/favicons?domain=<domain>&sz=64
   ```

3. favicon 加载失败时，回退到标题首字母；如果标题不可用，则使用分类图标。

`LinkIcon` 负责封装该逻辑，避免把图标 fallback 分散到卡片组件中。

## 9. 搜索设计

搜索在前端本地完成，不请求服务器。

匹配字段：

- 链接标题
- 链接描述
- URL
- tags

搜索结果保留原分类结构，只显示包含匹配链接的分类。空查询显示全部分类。

## 10. 组件边界

第一版可以在 `App.tsx` 中保留组件定义，但需要有清晰边界：

- `Sidebar`：分类导航和品牌入口。
- `Hero`：主视觉与说明。
- `SearchPanel`：搜索输入与结果提示。
- `CategorySection`：分类标题、描述和链接网格。
- `NavCard`：单个链接卡片。
- `ThemeToggle`：主题状态切换。
- `LinkIcon`：图标显示与 fallback。

如果 `App.tsx` 明显过长，再将组件拆到 `src/components/`。第一版不为拆分而拆分。

## 11. 测试策略

测试使用 Vitest、Testing Library 和 jsdom。

需要覆盖：

- 页面显示 `MCNAV`。
- 页面不显示 `TwoNav` 和“管理记录”。
- 搜索能按标题、描述、URL、tags 过滤。
- 主题按钮存在并能切换状态。
- 无 `icon` 的链接能生成 favicon URL。
- favicon 加载失败后显示 fallback。
- Markdown frontmatter 能解析为 `NavCategory`。
- `content/categories/*.md` 不包含 “TwoNav 自动导入” 类文本。

完成验证命令：

```bash
npm run test
npm run build
```

## 12. 完成标准

完成后应满足：

1. 仓库根目录存在完整 Vite + React + TypeScript 项目。
2. `content/categories/*.md` 可直接编辑添加记录。
3. 首页品牌为 MCNAV，视觉为 Apple Clean + Minecraft Accent。
4. 右上角没有“管理记录”，只有主题相关控件。
5. 初始数据来自 `TwoNav_bookmarks_20260702_171148.html`。
6. 空的“最近热门”分类不生成到最终内容中。
7. `npm run test` 通过。
8. `npm run build` 通过。
