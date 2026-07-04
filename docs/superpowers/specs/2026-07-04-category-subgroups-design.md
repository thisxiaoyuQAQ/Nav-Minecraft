# 分类内二级分组设计

## 背景

MCNAV 当前是一个 Vite + React + TypeScript 静态导航站。一级分类数据维护在 `content/categories/*.md` 的 YAML frontmatter 中，每个分类通过 `links` 数组列出资源卡片。用户希望在每个一级分类下自由添加二级分类，例如“服务端核心”下按“Mod服核心”“插件服核心”等分组，同时保留现有普通链接写法。

## 目标

- 在现有 `links` 字段内支持普通链接项和二级分组项混排。
- 保持旧格式 `links: NavLink[]` 完全兼容，不要求一次性迁移现有分类文件。
- Markdown 中的顺序即页面展示顺序，普通链接和二级分组可以交错出现。
- 搜索命中二级分组内链接时，保留分组标题，并只显示命中的子链接。
- 页面统计按实际资源链接数量计算，而不是按外层 `links.length` 计算。
- 构建和测试阶段尽早暴露无效分组结构，避免静默丢资源。

## 非目标

- 不做无限层级嵌套分类。
- 不做后台可视化编辑器。
- 不做拖拽排序。
- 不做分组折叠/展开。
- 不根据 `tags` 自动分组。
- 不改变文章系统或外部链接打开方式。

## 内容格式

分类 Markdown 继续使用 frontmatter。`links` 仍然是唯一主列表，但列表项允许两种形态。

### 普通链接项

现有写法保持不变：

```yaml
links:
  - title: 测试1
    url: https://example.com
    description: 普通链接
    tags: [test]
```

### 二级分组项

新增分组项写法：

```yaml
links:
  - group: 群聊
    links:
      - title: 点击加入官方交流群1
        url: https://qm.qq.com/q/TfSecPsNic
        description: 加入 MCNAV 官方 QQ 交流群
        tags: [qq, community, contact]

      - title: 点击加入官方交流群2
        url: https://qm.qq.com/q/TfSecPsNic
        description: 加入 MCNAV 官方 QQ 交流群
        tags: [qq, community, contact]
```

完整混排示例：

```yaml
links:
  - title: 测试1
    url: https://example.com
    description: 普通链接
    tags: [test]

  - group: 群聊
    links:
      - title: 点击加入官方交流群1
        url: https://qm.qq.com/q/TfSecPsNic
        description: 加入 MCNAV 官方 QQ 交流群
        tags: [qq, community, contact]

  - title: 测试2
    url: https://example.com
    description: 普通链接
    tags: [test]
```

页面必须按上面的顺序展示：先显示“测试1”卡片，再显示“群聊”分组及其卡片，最后显示“测试2”卡片。

## 数据模型

现有 `NavCategory.links` 从纯 `NavLink[]` 调整为混合入口数组：

```ts
export type NavEntry = NavLink | NavGroup

export interface NavLink {
  type: 'link'
  title: string
  url: string
  description: string
  icon?: string
  tags: string[]
}

export interface NavGroup {
  type: 'group'
  name: string
  links: NavLink[]
}

export interface NavCategory {
  id: string
  name: string
  icon: string
  description: string
  links: NavEntry[]
}
```

解析后给普通链接和分组都添加 `type` 字段。这样渲染、搜索和统计逻辑可以通过 discriminated union 判断入口类型，不需要靠字段是否存在来猜测。

## 解析规则

`parseMarkdownCategory` 继续读取分类 frontmatter，并将 `links` 数组逐项解析：

1. 如果列表项包含有效 `group` 字符串，则按二级分组解析。
2. 二级分组必须包含 `links` 数组。
3. 分组内每一项必须是普通链接，不支持再嵌套分组。
4. 如果列表项不是分组，则按普通链接解析。
5. 普通链接必须包含非空 `title` 和非空 `url`。
6. `description`、`icon`、`tags` 继续沿用现有默认和清洗逻辑。

无 `links` 或 `links` 不是数组时，分类仍解析为空列表，保持现有容错行为。

## 页面展示

首页一级分类结构保持不变：分类标题、描述、资源数量和卡片区域。

分类内容按 `links` 数组顺序逐项渲染：

- 普通链接项渲染为现有资源卡片。
- 二级分组项渲染为当前一级分类内部的轻量小标题，然后渲染该分组内的资源卡片。
- 二级分组不升级成新的一级分类，不进入侧边栏导航。

示意：

```text
服务端核心
  Paper 卡片

  Mod服核心
    Forge 卡片
    Fabric 卡片

  插件服核心
    Purpur 卡片
    Spigot 卡片
```

二级分组标题应使用比一级分类更弱的视觉层级，避免页面看起来像多套并列分类。

## 统计规则

所有资源数量统一按实际链接数量计算：

- 普通链接项计为 1。
- 二级分组自身不计数。
- 二级分组内每个链接各计为 1。

因此：

```yaml
links:
  - title: 测试1
  - group: 群聊
    links:
      - title: 群聊1
      - title: 群聊2
  - title: 测试2
```

该分类显示数量为 `4`。

需要新增或抽出统计工具函数，例如 `countCategoryLinks(category)` 与 `countEntriesLinks(entries)`，供顶部总数、侧边栏数量、分类标题右侧数量和搜索结果数量复用。

## 搜索行为

搜索匹配范围保持现有逻辑：链接的 `title`、`description`、`url` 和 `tags`。

过滤规则：

- 空搜索词：返回原始分类数据，保持原顺序。
- 命中普通链接：保留该普通链接。
- 命中二级分组内链接：保留该二级分组标题，并只保留命中的子链接。
- 二级分组内没有命中链接：移除该分组。
- 一级分类内没有任何命中链接：移除该一级分类。

二级分组名称本身暂不参与搜索匹配。这样可以保持“只显示命中资源”的搜索结果语义，避免搜索分组名时整组资源全部出现。

## 错误处理

内容结构错误应尽早失败：

- 普通链接缺少非空 `title` 或 `url`：抛出解析错误。
- 分组项 `group` 为空：抛出解析错误。
- 分组项 `links` 不是数组：抛出解析错误。
- 分组内出现嵌套分组：抛出解析错误。

错误信息应包含分类 fallback id 和字段路径，例如 `links[3].links[1].title`，方便定位出错内容。

## 测试计划

### 解析测试

覆盖：

- 旧格式 `links: NavLink[]` 仍能解析。
- 普通链接和二级分组可以在同一个 `links` 数组中混排。
- 分组内链接复用普通链接解析逻辑，包括默认 `description`、可选 `icon` 和 `tags` 清洗。
- 分组名为空时抛错。
- 分组 `links` 非数组时抛错。
- 分组内嵌套分组时抛错。

### 搜索测试

覆盖：

- 搜索普通链接时只保留命中的普通链接。
- 搜索二级分组内链接时保留分组标题，只保留命中的子链接。
- 没有命中的空分组会被移除。
- 一级分类没有命中内容时会被移除。
- 空搜索词返回原始分类数据。

### 统计与内容集成测试

覆盖：

- 统计函数按实际链接数计算资源数量。
- 所有分类 id 仍唯一。
- 所有实际资源链接 URL 仍必须是 `http(s)` 或 `/posts/`。
- 内容测试遍历普通链接和分组内链接，不遗漏嵌套在分组里的资源。

## 实施顺序

1. 扩展 `src/navTypes.ts`，新增 `NavEntry` 和 `NavGroup`。
2. 调整 `src/parseMarkdownNav.ts`，支持混合 `links` 列表并补充统计工具函数。
3. 更新 `filterCategories`，按新搜索行为过滤普通链接和分组。
4. 更新 `src/App.tsx`，使用统计工具函数，并让 `CategorySection` 按入口类型渲染普通卡片或二级分组。
5. 更新 `src/App.css`，添加二级分组标题和分组内卡片区域样式。
6. 更新 `src/parseMarkdownNav.test.ts` 和 `src/contentCategories.test.ts`。
7. 选择一个分类文件添加少量二级分组示例，验证真实内容格式。
8. 运行测试和构建验证。

## 验收标准

- 旧的分类 Markdown 不修改也能正常显示。
- 新写法 `- group: xxx` 能在一级分类内部显示为二级分组。
- 普通链接和二级分组按 Markdown 顺序混排展示。
- 搜索命中分组内资源时显示分组标题，并只显示命中的资源卡片。
- 顶部总数、侧边栏数量和分类数量都按实际资源链接数统计。
- 无效分组结构会让测试或构建失败并给出可定位的错误信息。
- `npm run test -- --run` 通过。
- `npm run build` 通过。
