---
id: server-core
name: 服务端核心
icon: 🧱
description: Paper、Folia、Velocity、Forge、Fabric 等 Minecraft 服务端核心与代理端入口。
links:
  - group: 原版核心
    links:
      - title: Vanilla
        url: https://getbukkit.org/download/vanilla
        description: 官方原版服务端核心 无插件与模组支持 适合纯原版体验
        tags: [server, vanilla]
  - group: Bukkit / Paper 系
    links:
      - title: Spigot
        url: https://getbukkit.org/download/spigot/
        description: 早期 Bukkit 核心 插件兼容性基础 性能优化较弱
        tags: [server, bukkit, spigot]    
      - title: Paper
        url: https://papermc.io/downloads/paper
        description: 主流高性能 Bukkit 核心 PaperMC 维护 生态最活跃
        tags: [server, papermc, paper]
      - title: Purpur
        url: https://purpurmc.org/
        description: Paper 下游 进一步性能优化与丰富配置项 Bukkit 生态推荐
        tags: [server, paper, core]
      - title: Leaves
        url: https://leavesmc.org/
        description: Paper 下游 专注修复被破坏的原版特性 适合生电玩法
        tags: [server, core]
      - title: Leaf
        url: https://github.com/Winds-Studio/Leaf
        description: Purpur + Gale 下游 专注性能提升 尊重原版行为 兼容插件生态
        tags: [server, core, github]
  - group: Folia 系
    links:
      - title: Foila
        url: https://papermc.io/software/folia
        description: PaperMC 多线程核心 区域化并行调度 原生不支持 Bukkit 插件
        tags: [server, papermc, folia]
      - title: Luminol
        url: https://luminolsuki.moe/
        description: Folia 下游 面向生存与无政府服务器 提供丰富配置与 API
        tags: [server, core, github]
      - title: LightingLuminol
        url: https://github.com/LuminolMC/LightingLuminol
        description: Luminol 下游 目标是在 Folia 上运行更多 Bukkit 插件
        tags: [server, core, github]
      - title: Lophine
        url: https://github.com/LuminolMC/Lophine
        description: Luminol 下游 面向生电玩家 在 Folia 上实现更多生电特性
        tags: [server, core, github]
  - group: Mod 服核心
    links:
      - title: Forge
        url: https://files.minecraftforge.net/net/minecraftforge/forge/
        description: 老牌模组加载器 生态成熟 模组数量最多
        tags: [modding, forge, server]
      - title: Fabric
        url: https://fabricmc.net/use/server/
        description: 轻量模组加载器 更新快、启动快 适合新版本与性能敏感场景
        tags: [modding, fabric, server]
      - title: Sponge
        url: http://www.spongepowered.org/
        description: 原生 SpongeAPI 平台 支持 Forge 模组 不支持 Bukkit 插件
        tags: [server, sponge]
  - group: 混合端 (Bukkit + 模组)
    links:
      - title: Catserver
        url: https://catmc.org/
        description: 老牌 Bukkit + Forge 混合端 已停更
        tags: [server, core]    
      - title: Mohist
        url: https://www.mohistmc.cn/resources/mohist
        description: Forge + Bukkit 混合端 同时运行模组与 Bukkit 插件
        tags: [server, forge, bukkit]
      - title: Youer
        url: https://www.mohistmc.cn/resources/youer
        description: NeoForge + Bukkit 混合端 完整兼容 Bukkit/Spigot/Paper/Purpur API
        tags: [server, core, mohist]
      - title: Silkard
        url: https://www.mohistmc.cn/resources/silkard
        description: Fabric + Bukkit 混合端 兼容 Bukkit、Spigot 插件
        tags: [server, core, mohist]
      - title: Arclight
        url: https://github.com/IzzelAliz/Arclight
        description: 灵活混合端 支持 Fabric+Bukkit 或 Forge+Bukkit 两种组合
        tags: [server, forge, bukkit, github]
      - title: Uranium
        url: https://starleap.lanzout.com/iPrLI1v1e1dc
        description: 1.7.10 Bukkit + Forge 混合端 已停更
        tags: [server, core, download]
  - group: 代理端
    links:
      - title: Bungeecord
        url: https://www.spigotmc.org/wiki/bungeecord/
        description: 老牌群组代理端 已过时 建议改用 Velocity
        tags: [proxy, spigot, server]    
      - title: Velocity
        url: https://papermc.io/software/velocity
        description: 新时代高性能代理端 群组服核心 PaperMC 维护 推荐
        tags: [proxy, papermc, server]
      - title: Hexcord
        url: https://github.com/CronixMC/HexaCord
        description: 面向低版本模组服的 BungeeCord 分支 修复部分模组兼容问题
        tags: [proxy, server, github]
---
