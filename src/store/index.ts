import { create } from 'zustand'
import { db, type Poem, type AiConfig, type ReviewRecord } from '../lib/db'
import { useUserStore } from './user'

interface AppState {
  poems: Poem[]
  poemsLoaded: boolean
  currentPoem: Poem | null
  aiConfigs: AiConfig[]
  reviewRecords: ReviewRecord[]
  dailyReviewCount: number
  loadPoems: () => Promise<void>
  loadAiConfigs: () => Promise<void>
  saveAiConfig: (config: AiConfig) => Promise<void>
  loadReviewRecords: () => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  poems: [],
  poemsLoaded: false,
  currentPoem: null,
  aiConfigs: [],
  reviewRecords: [],
  dailyReviewCount: 0,

  loadPoems: async () => {
    const all = await db.poems.toArray()
    // Deduplicate by title to prevent React key conflicts
    const seen = new Set<string>()
    const poems: Poem[] = []
    for (const p of all) {
      const key = p.title + '|' + p.author + '|' + p.grade
      if (!seen.has(key)) {
        seen.add(key)
        poems.push(p)
      }
    }
    set({ poems, poemsLoaded: true })
  },

  loadAiConfigs: async () => {
    const configs = await db.aiConfigs.toArray()
    set({ aiConfigs: configs })
  },

  saveAiConfig: async (config: AiConfig) => {
    // Remove userId from config for storage (single-user local app)
    const { userId: _, ...saveData } = config
    // Find existing config for this platform
    const existing = await db.aiConfigs.where('platform').equals(config.platform).first()
    if (existing) {
      await db.aiConfigs.update(existing.id!, saveData as any)
    } else {
      await db.aiConfigs.add(saveData as any)
    }
    await get().loadAiConfigs()
  },

  loadReviewRecords: async () => {
    const user = useUserStore.getState().currentUser
    if (!user) return
    const records = await db.reviewRecords.where('userId').equals(user.id!).toArray()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daily = records.filter(r => new Date(r.nextReviewAt) <= today && r.stage < 6)
    set({ reviewRecords: records, dailyReviewCount: daily.length })
  },
}))
