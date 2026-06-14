# K12 古诗学习项目 - 需求文档

## 项目概述

纯前端的K12古诗学习应用，覆盖小学一年级到高中古诗词、文言文。支持背诵模式（艾宾浩斯遗忘曲线）和古诗知识学习，集成AI助手辅助学习。

## 核心功能

### 1. 诗词学习
- 按年级、学期、朝代、难度筛选诗词
- 诗词详情：原文、注释、译文、赏析
- 逐字朗读（Web Speech API）
- 划词工具条：选中文字后弹出工具栏，支持：
  - 朗读选中内容
  - 查看拼音
  - AI分析（意境、修辞、用法等）

### 2. 背诵模式
- 艾宾浩斯遗忘曲线复习计划
- 7个复习阶段：学习后1天、2天、4天、7天、15天、30天、60天
- 背诵状态跟踪：未学习 → 学习中 → 已掌握
- 每日复习提醒
- 背诵计时和历史记录

### 3. 古诗知识学习
- 意境分析
- 诗句赏析
- 实词/虚词解析
- 作者信息
- 创作背景
- AI知识考点（模拟考试题目）

### 4. AI 助手
- 支持国内AI平台：
  - 通义千问（Qwen）
  - DeepSeek
  - Kimi（Moonshot）
  - MiniMax
- 用户自行配置API Key（存储在IndexedDB）
- 多轮对话
- 诗词相关问答

### 5. 本地存储
- IndexedDB 存储：
  - 用户配置（AI API Key）
  - 学习进度
  - 背诵计划
  - 收藏诗词
  - 错题本

## 数据来源

从 `poetry_quiz_system` 项目导出：
- 诗词数据（JSON格式）
- 包含：标题、作者、朝代、内容、注释、译文、赏析、年级、难度等

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 本地存储 | IndexedDB（Dexie.js） |
| 朗读 | Web Speech API |

## 页面结构

```
src/
├── pages/
│   ├── Home.tsx              # 首页
│   ├── PoemList.tsx          # 诗词列表
│   ├── PoemDetail.tsx        # 诗词详情
│   ├── RecitationMode.tsx    # 背诵模式
│   ├── StudyPlan.tsx         # 学习计划（艾宾浩斯）
│   ├── Review.tsx            # 每日复习
│   ├── Favorites.tsx         # 收藏
│   ├── Settings.tsx          # 设置（AI配置）
│   └── AIChat.tsx            # AI助手
├── components/
│   ├── TextSelectionToolbar.tsx  # 划词工具条
│   ├── AIAssistant.tsx       # AI助手面板
│   ├── PoemReader.tsx        # 诗词朗读组件
│   └── ui/                   # 基础UI组件
├── store/                    # Zustand状态
├── lib/
│   ├── db.ts                 # IndexedDB操作
│   ├── ai.ts                 # AI接口调用
│   └── speech.ts             # 朗读功能
├── hooks/                    # 自定义Hooks
└── data/                     # 诗词JSON数据
```

## 开发阶段

### 阶段1：基础框架（1-2天）
- 项目初始化（React + Vite + Tailwind）
- 路由配置
- IndexedDB数据库设计
- 诗词数据导入

### 阶段2：核心学习功能（2-3天）
- 诗词列表和详情页
- 朗读功能
- 收藏功能
- 学习进度记录

### 阶段3：背诵模式（2-3天）
- 艾宾浩斯遗忘曲线算法
- 学习计划创建和管理
- 每日复习功能
- 背诵状态跟踪

### 阶段4：AI助手（1-2天）
- AI配置页面
- 多平台AI接口适配
- 对话功能

### 阶段5：划词工具（1天）
- 文本选择检测
- 工具条UI
- 划词AI分析

### 阶段6：优化完善（1-2天）
- UI美化
- 性能优化
- 测试和修复
