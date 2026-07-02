# MCNAV UI Overhaul Design

日期：2026-07-03

## 1. 背景与目标

MCNAV 当前是一个 Vite + React + TypeScript 静态导航站，数据来自 `content/categories/*.md`。现有页面已经具备分类导航、本地搜索、三态主题切换和链接图标 fallback，但整体视觉仍偏常规卡片站：桌面端页面被限制在中间宽度，宽屏空间没有充分利用；Apple 风的通透、留白和层级感还不够完整；Minecraft 的像素/方块识别只停留在轻量装饰。

本次目标是只重做新 React 首页的 UI：把页面扩展为全屏导航仪表盘，以 Apple Clean 为主视觉，用白绿玻璃、柔和阴影、清晰排版和大面积呼吸感提升品质；再用克制的 Minecraft 像素草方块元素强化 MCNAV 品牌记忆点。

用户已确认采用方向：**A. Apple Clean + Minecraft 像素点缀**。

## 2. 范围

### 包含

- 优化 `src/App.tsx` 中首页结构所需的 className、装饰元素和可访问语义。
- 重写 `src/App.css` 的布局、颜色变量、响应式、卡片、Hero、侧栏和动效。
- 必要时更新 `src/App.test.tsx`，确保关键语义和功能不因 UI 调整回退。
- 保持白天、黑夜、跟随系统主题都可用。
- 使用现有 React/Vite/CSS 能力完成，不引入新 UI 依赖。

### 不包含

- 不修改 `content/categories/*.md` 数据内容或 frontmatter 格式。
- 不修改 `src/navData.ts`、`src/parseMarkdownNav.ts`、`src/linkIcons.ts`、`src/theme.ts` 的核心逻辑。
- 不修改 `wwwroot/` 旧 PHP / TwoNav 站点源码。
- 不复制 `https://mcnav.cn` 旧站实现；只保留“资源导航站”的信息密度和 MCNAV 品牌定位作为参考。
- 不新增路由、后台、登录、在线编辑或拖拽排序。

## 3. 设计原则

1. **Apple 主导**：大留白、通透玻璃、柔和阴影、细边框、清晰字阶和低噪声层级。
2. **Minecraft 点缀**：像素草方块 Logo、浅绿色像素网格、Hero 角落方块矩阵、卡片 hover 的像素高光，而不是重度游戏 HUD。
3. **白绿风格**：白色、薄荷绿、草绿、深林绿构成主色；避免刺眼纯绿和低龄卡通感。
4. **全屏铺开**：页面背景、侧栏和内容区覆盖整个浏览器宽度；只保留安全 padding，不再把整个 app 限制在居中窄容器。
5. **功能不回退**：搜索、分类跳转、主题切换、favicon/fallback 和外链行为全部保持。
6. **响应式优先**：桌面端充分利用宽屏；平板端压缩侧栏；移动端变为顶部/横向导航和单列内容。

## 4. 信息架构

页面仍由现有区域组成：

1. `Sidebar`：MCNAV 品牌和分类导航。
2. `Topbar`：站点统计和主题切换。
3. `Hero`：品牌定位、核心文案和资源类型标签。
4. `SearchPanel`：全局本地搜索入口和结果统计。
5. `CategorySection`：分类标题、描述、数量 chip 和资源卡片网格。
6. `NavCard`：链接图标、标题、描述和外链箭头。

不改变数据流：`App` 接收 `initialCategories`，用 `filterCategories(initialCategories, query)` 得到可见分类，再渲染分类和链接。

## 5. 布局设计

### 桌面端

- `.app-shell` 改为全宽布局：`width: 100%`、`min-height: 100vh`，使用 `clamp(16px, 2vw, 32px)` 作为外层安全 padding。
- 保留双栏结构：左侧 `Sidebar` 固定宽度约 280px，右侧 `main-content` 占满剩余空间。
- `Sidebar` 使用 `position: sticky`，高度为视口减去外层 padding，滚动分类时不遮挡主内容。
- `main-content` 使用网格间距组织 Topbar、Hero、SearchPanel 和分类栈。
- 卡片网格使用 `repeat(auto-fit, minmax(260px, 1fr))` 或相近策略，让宽屏自动出现更多列。

### 平板端

- 当宽度不足以舒适显示双栏时，`.app-shell` 切换为单列。
- `Sidebar` 变成顶部玻璃导航条，品牌在上，分类导航横向滚动或多列紧凑排列。
- 主内容继续全宽铺开，Hero 和搜索区保持充足留白。

### 移动端

- 外层 padding 降低到 12-16px。
- Hero 标题、搜索框和卡片单列显示。
- 分类导航横向滚动，避免长列表把首屏挤空。
- 像素装饰降低透明度或隐藏部分大型装饰，优先保证阅读和点击。

## 6. 视觉系统

### 亮色模式

亮色模式采用暖白玻璃和低饱和绿色：

- 页面背景：暖白到薄荷绿渐变。
- 主文本：深绿黑。
- 次级文本：灰绿。
- 强调色：草绿 / 苔藓绿。
- 面板：高透明白色玻璃。
- 边框：低透明绿色灰。
- 阴影：柔和、扩散、低透明。

建议 CSS 变量：

```css
--bg: #f6fbf6;
--bg-soft: #edf7ef;
--panel: rgba(255, 255, 255, 0.72);
--panel-strong: rgba(255, 255, 255, 0.9);
--text: #162318;
--muted: #657466;
--line: rgba(37, 91, 48, 0.14);
--accent: #3bbf63;
--accent-strong: #1f8d45;
--accent-soft: rgba(59, 191, 99, 0.13);
```

### 暗色模式

暗色模式采用深云杉黑和墨绿玻璃：

- 页面背景：深云杉黑到墨绿渐变。
- 主文本：近白微绿。
- 次级文本：柔和灰绿。
- 强调色：低饱和翡翠绿。
- 面板：深墨绿半透明玻璃。
- 边框：低透明浅绿。
- 光晕：绿色只用于品牌、Hero 和 hover 状态。

建议 CSS 变量：

```css
--bg: #071109;
--bg-soft: #101b12;
--panel: rgba(18, 31, 21, 0.72);
--panel-strong: rgba(20, 35, 23, 0.92);
--text: #f2f8f1;
--muted: #aab9aa;
--line: rgba(190, 224, 196, 0.16);
--accent: #6ee083;
--accent-strong: #9cf0a4;
--accent-soft: rgba(110, 224, 131, 0.14);
```

### 字体与排版

- 继续使用系统字体栈，优先获得 Apple 平台的 San Francisco 观感。
- Hero 标题使用大字号、紧凑行高和轻微负字距，体现 Apple 产品页风格。
- 正文描述保持较高行高，提升中文阅读舒适度。
- 分类名、卡片标题和数量 chip 使用较高字重，但避免所有元素都加粗。

## 7. 组件设计

### Sidebar

- `brand-mark` 改成更完整的品牌块：像素草方块图标 + `MCNAV` + `Minecraft Navigation`。
- `brand-icon` 使用像素叠层背景：绿色渐变、方块纹理、内阴影和轻微高光。
- 分类项使用 macOS 侧栏式 pill：默认低对比，hover/focus 时出现浅绿玻璃底和边框。
- `nav-count` 是轻量 chip，显示分类链接数。
- 桌面端滚动条保持低存在感；移动端分类导航支持横向滚动。

### Topbar

- 作为主内容顶部的悬浮玻璃状态条。
- 左侧显示 `MCNAV` 和“分类数 · 资源入口数”。
- 右侧主题按钮保留三态循环，视觉改成 iOS 控件风：圆角、细边框、透明背景、hover/focus 状态。
- Topbar 在小屏上允许换行，主题按钮不挤压统计文本。

### Hero

- 继续使用标题 `方块世界的高效入口`。
- 继续使用副标题 `收集服务端核心、插件 Wiki、开发文档、工具与社区资源。`
- 背景为大圆角玻璃面板，加入柔和径向绿光。
- 增加右下或右侧的抽象像素草方块矩阵，使用低透明度和遮罩，不覆盖文字。
- `hero-tags` 使用白绿 capsule，显示 `Server Core`、`Plugin Wiki`、`Dev Docs`、`Tools`。

### SearchPanel

- 搜索框成为更明显的全局入口：更高、更宽、更强 focus ring。
- 保留现有 placeholder：`搜索核心、插件、Wiki、工具或服务器资源`。
- 结果统计保留现有逻辑：空查询显示总数，有查询显示 `找到 X / Y 个资源`。
- 搜索区在移动端垂直堆叠，统计文本放在搜索框下方。

### CategorySection

- 分类容器保持玻璃卡片，但降低厚重阴影，让多分类堆叠时不压迫。
- 分类标题区使用三列：图标、标题描述、数量 chip。
- `category-icon` 视觉上接近小方块/物品图标容器。
- `category-total` 使用绿色状态 chip，和侧栏数量 chip 统一。

### NavCard

- 卡片使用半透明白绿玻璃、圆角和细边框。
- 图标容器保留 manual icon、favicon 和 fallback 三层策略。
- 标题和描述分层清楚，描述最多通过 CSS 保持舒适行高，不额外截断内容。
- hover/focus 时轻微上浮，边缘出现绿色像素高光，外链箭头更明显。
- `:focus-visible` 与 hover 风格一致，键盘用户能看到当前卡片。

## 8. 动效与可访问性

- 动效只使用 CSS transition/transform，不引入动画库。
- hover 上浮幅度控制在 2-4px，避免页面像游戏 UI 一样跳动。
- 全局加入 `@media (prefers-reduced-motion: reduce)`，禁用或缩短动画。
- 保留语义标签：`header[role="banner"]`、`aside[aria-label="分类导航"]`、分类 section heading、搜索 label。
- 所有可交互元素都有清晰 `:focus-visible`。
- 颜色对比在亮暗主题下都要保持可读，特别是灰绿次级文本和玻璃面板边框。

## 9. 测试策略

采用测试先行更新 UI 结构期望：

1. 更新或新增 `src/App.test.tsx` 中的结构断言，确认页面仍渲染：
   - `banner` 顶部栏；
   - `MCNAV 首页` 品牌链接；
   - Hero 标题；
   - 搜索框；
   - 分类导航链接；
   - 分类标题；
   - 资源卡片外链。
2. 如果新增可访问 label 或结构 class 对行为有意义，先写测试并观察失败。
3. 实现 `App.tsx` 和 `App.css` 改动。
4. 运行 `npm run test -- --run`，确认搜索、主题切换、favicon fallback 和旧入口排除都通过。
5. 运行 `npm run build`，确认 TypeScript 和 Vite 构建通过。

## 10. 验收标准

完成后应满足：

- 页面在宽屏下是真正全屏布局，不再是居中的窄容器。
- 第一视觉是精致、通透、留白充足的 Apple 风导航站。
- Minecraft 像素/草方块元素清晰可见但克制，不影响阅读。
- 主色是白绿风格，亮色和暗色模式都统一。
- 侧栏、Hero、搜索区、分类区和卡片视觉统一。
- 移动端没有横向页面溢出，分类和卡片仍可正常使用。
- 搜索、主题切换、分类跳转、外链、favicon 和 fallback 行为不回退。
- `npm run test -- --run` 通过。
- `npm run build` 通过。
