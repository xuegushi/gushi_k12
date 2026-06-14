import Dexie, { type Table } from 'dexie'

export interface AuthorInfo {
  name: string
  dynasty: string
  description: string
  representative_works: string[]
}

export interface ExamPoint {
  type: string
  name: string
  question: string
  answer: string
  analysis: string
  difficulty: string
}

export interface Poem {
  id?: number
  title: string
  author: string
  dynasty: string
  content: string[]
  translation: string
  annotation: string
  appreciation: string
  background: string
  tags: string[]
  grade: number
  term: number
  difficulty: number
  examFrequency: number
  type: string
  author_info?: AuthorInfo | null
  exam_points?: ExamPoint[]
}

export interface User {
  id?: number
  name: string
  guest: number
  createdAt: Date
}

export interface StudyPlan {
  id?: number
  userId: number
  name: string
  grade: number
  term: number
  poemTitles: string[]
  completedTitles: string[]
  createdAt: Date
}

export interface ReviewRecord {
  id?: number
  userId: number
  poemTitle: string
  poemAuthor: string
  stage: number
  lastReviewedAt: Date
  nextReviewAt: Date
  reviewCount: number
}

export interface Favorite {
  id?: number
  userId: number
  poemTitle: string
  createdAt: Date
}

export interface AiConfig {
  id?: number
  userId: number
  platform: 'qwen' | 'deepseek' | 'kimi' | 'minimax'
  apiKey: string
  model?: string
  availModels?: string[]
  enabled: boolean
}

export interface ChatMessage {
  id?: number
  userId: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AiCallLog {
  id?: number
  platform: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  duration: number
  createdAt: Date
}

class GushiDB extends Dexie {
  users!: Table<User, number>
  poems!: Table<Poem, number>
  studyPlans!: Table<StudyPlan, number>
  reviewRecords!: Table<ReviewRecord, number>
  favorites!: Table<Favorite, number>
  aiConfigs!: Table<AiConfig, number>
  chatMessages!: Table<ChatMessage, number>
  aiCallLogs!: Table<AiCallLog, number>

  constructor() {
    super('gushi_k12')
    this.version(9).stores({
      users: '++id, name, guest',
      poems: '++id, title, author, grade, type, difficulty',
      studyPlans: '++id, userId, grade, term',
      reviewRecords: '++id, userId, poemTitle, stage, nextReviewAt',
      favorites: '++id, userId, poemTitle',
      aiConfigs: '++id, userId, platform',
      chatMessages: '++id, userId, timestamp',
      aiCallLogs: '++id, platform, createdAt',
    })
  }
}

export const db = new GushiDB()
