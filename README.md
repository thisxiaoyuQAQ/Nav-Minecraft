# Nav-Minecraft / MCNAV

Minecraft 插件 Wiki、服主帮助与资源导航站。

网站：[mcnav.cn](https://mcnav.cn "喵喵喵")

欢迎各位服主来小站光顾。如有新的 Wiki（最好是中文 Wiki）/ 论坛，欢迎提交 PR，感谢支持。

## 当前版本

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

文章则存放在 `content/posts/*.md`，每个文件即一篇文章，文件名（不含扩展名）作为 slug，访问地址为 `/posts/<slug>`。frontmatter 中的 `title`、`description`、`date`、`tags` 均为可选项：未提供 `title` 时依次回退到正文第一个一级标题，再回退到 slug。正文按 Markdown 渲染，其中的相对路径链接（如 `/posts/xxx`）会做站内跳转，外部链接在新标签页打开。

文章中引用 `public/` 里的图片用 `/图片名`（如 `/Nether_Star.gif`）。支持按比例调整大小：

```text
![描述](/Nether_Star.gif)          原图大小
![描述](/Nether_Star.gif =300)     宽 300px，高度按比例
![描述](/Nether_Star.gif =50%)     宽 50%，高度按比例
![描述](/Nether_Star.gif =300x200) 指定宽高（一般不用）
```

由于是单页应用，部署时需要让 `/posts/*` 等非根路径回退到 `index.html`（SPA fallback），否则直接打开或刷新深链会 404。

## 旧站源码

`wwwroot/` 是旧 PHP / TwoNav 站点源码，仅作为视觉、内容和历史结构参考；新的 React 静态站运行时不依赖它，也不需要修改它。

## 联系方式

> 如果您对这个项目感兴趣或有任何问题，请随时向我们提问。

QQ群：[426996480](https://qm.qq.com/q/rI1LN7utsA) | Telegram：[点击联系我](https://t.me/xiaoyumc)

## 请给我们一个 ⭐Star！

> 你的每一个免费的 ⭐Star 就是我们每一个前进的动力。

[![Star History Chart](https://api.star-history.com/svg?repos=thisxiaoyuQAQ/Nav-Minecraft&type=Date)](https://star-history.com/#thisxiaoyuQAQ/Nav-Minecraft&Date)
