# K12 古诗学习项目 - 开发计划

## 项目初始化

### 步骤1：创建React项目
```bash
cd /Users/johnnyzhang/extra_gushi/gushi_k12
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install react-router-dom zustand dexie lucide-react
```

### 步骤2：配置Tailwind CSS
- 配置 vite.config.ts
- 添加 Tailwind 指令

### 步骤3：数据准备
- 从 poetry_quiz_system 导出诗词数据
- 创建数据导出脚本
- 转换为前端可用的JSON格式

## 核心模块实现

### 1. IndexedDB 数据库设计 (lib/db.ts)
```typescript
// 数据库表结构
- poems: 诗词数据（从JSON导入）
- studyPlans: 学习计划
- reviewRecords: 复习记录
- favorites: 收藏
- settings: 用户设置（AI配置）
- progress: 学习进度
```

### 2. 艾宾浩斯遗忘曲线算法
```typescript
// 复习间隔（天）
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60];

// 计算下次复习时间
function getNextReviewDate(stage: number, lastReview: Date): Date {
  const interval = REVIEW_INTERVALS[stage] || 60;
  return new Date(lastReview.getTime() + interval * 24 * 60 * 60 * 1000);
}
```

### 3. AI接口适配 (lib/ai.ts)
```typescript
// 支持的平台
interface AIPlatform {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  headers: Record<string, string>;
}

const PLATFORMS: AIPlatform[] = [
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'kimi', name: 'Kimi', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'minimax', name: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', model: 'abab5.5-chat' },
];
```

### 4. 划词工具条 (components/TextSelectionToolbar.tsx)
```typescript
// 监听文本选择事件
useEffect(() => {
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      // 显示工具条
      setShowToolbar(true);
      // 获取选中位置
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPosition({ top: rect.bottom, left: rect.left });
    }
  };
  document.addEventListener('mouseup', handleSelection);
  return () => document.removeEventListener('mouseup', handleSelection);
}, []);
```

## 开发时间估算

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 项目初始化、路由、数据库 | 0.5天 |
| 2 | 数据准备、诗词列表/详情 | 1天 |
| 3 | 朗读、收藏、进度 | 1天 |
| 4 | 背诵模式、艾宾浩斯 | 1.5天 |
| 5 | AI助手、设置页 | 1天 |
| 6 | 划词工具条 | 0.5天 |
| 7 | UI优化、测试 | 0.5天 |
| **总计** | | **6天** |
