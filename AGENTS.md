# AGENTS.md

## 项目概述

K12 古诗学习应用，纯前端项目，覆盖小学一年级到高中古诗词、文言文学习。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 本地存储 | IndexedDB (Dexie.js) |
| 图标 | Lucide React |
| 桌面端 | Tauri v2 |

## 核心功能

1. **诗词学习** - 按年级筛选、详情、朗读
2. **背诵模式** - 艾宾浩斯遗忘曲线复习
3. **知识学习** - 意境、诗句分析、实词虚词
4. **AI助手** - 国内AI平台（通义千问/DeepSeek/Kimi/MiniMax）
5. **划词工具** - 选中文字弹出工具条

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# Tauri 桌面端开发
npm run tauri:dev

# Tauri 桌面端构建
npm run tauri:build
```

## 项目结构

```
gushi_k12/
├── src/
│   ├── pages/          # 页面组件
│   ├── components/     # 通用组件
│   ├── store/          # Zustand状态
│   ├── lib/            # 工具函数
│   ├── hooks/          # 自定义Hooks
│   └── data/           # 诗词JSON数据
├── src-tauri/          # Tauri 桌面端配置
│   ├── src/            # Rust 源码
│   ├── icons/          # 应用图标
│   └── tauri.conf.json # Tauri 配置
├── docs/               # 文档
└── scripts/            # 数据导出脚本
```

## 数据来源

诗词数据从 `../poetry-quiz-system` 项目导出，使用 `scripts/export-poems.ts` 脚本。

## 注意事项

- 纯前端项目，无后端依赖
- 所有数据存储在浏览器IndexedDB
- AI API Key由用户自行配置
- 使用Web Speech API实现朗读
