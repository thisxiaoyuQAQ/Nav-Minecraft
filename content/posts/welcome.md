---
title: 欢迎使用 MCNAV 文章系统
description: 介绍如何在 content/posts 目录维护站内文章。
date: 2026-07-03
tags: [guide, mcnav]
---

MCNAV 现在支持通过 Markdown 编写站内文章，导航卡片可以直接指向 `/posts/<slug>` 内部页面。

## 如何新增文章

在 `content/posts/` 目录新增一个 Markdown 文件，例如 `my-guide.md`，即可通过 `/posts/my-guide` 访问。

- 文件名就是文章的 slug
- frontmatter 中的 `title`、`description`、`date`、`tags` 均为可选
- 没有填写 `title` 时，会读取正文第一个 `#` 标题

## 支持的 Markdown 语法

你可以使用 **粗体**、*斜体*、`行内代码`，以及：

1. 有序列表
2. 无序列表
3. [站内链接](/) 与外部链接

> 引用块用于强调补充说明。

```ts
console.log('代码块也支持。')
```
