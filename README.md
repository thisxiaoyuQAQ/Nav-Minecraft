# MCNAV

MCNAV 是一个面向 Minecraft 服主、插件开发者和资源维护者的静态导航站。当前根目录项目使用 Vite + React + TypeScript 构建，链接数据维护在 Markdown/YAML 文件中，方便直接编辑和版本管理。

## 特性

- 品牌与首页统一为 `MCNAV`。
- Apple Clean + Minecraft Accent 视觉风格。
- 本地搜索：按标题、描述、URL 和 tags 过滤资源。
- 主题切换：跟随系统、白天、黑夜三态循环，并保存到 `localStorage`。
- 链接图标：手写 icon、域名 favicon、标题首字母 fallback 三层策略。
- 数据源来自 `content/categories/*.md`，初始内容整理自 `TwoNav_bookmarks_20260702_171148.html`。

## 常用命令

```bash
npm install
npm run dev
npm run test -- --run
npm run build
```

## 内容维护

每个分类对应一个 Markdown 文件：

```text
content/categories/*.md
```

首页只读取 YAML frontmatter 中的 `id`、`name`、`icon`、`description` 和 `links`。正文可用于维护备注，但不会渲染到首页。

## 旧站源码

`wwwroot/` 是旧 PHP / TwoNav 站点源码，仅作为视觉、内容和历史结构参考；新的 React 静态站运行时不依赖它，也不需要修改它。
