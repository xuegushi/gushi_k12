import { db, type StudyPlan, type Poem } from './db'
import { useUserStore } from '../store/user'
import { getNextReviewDate } from './recitation'

export function getPlanLabel(grade: number, term: number): string {
  if (grade === 10 && term === 1) return '高中必修（上册）'
  if (grade === 10 && term === 2) return '高中必修（下册）'
  if (grade === 11 && term === 1) return '高中选修（上册）'
  if (grade === 11 && term === 2) return '高中选修（中册）'
  if (grade === 12 && term === 1) return '高中选修（下册）'
  if (grade === 12 && term === 2) return '高中选修（下册）'
  const gn = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
  const tn = term === 1 ? '上学期' : '下学期'
  return grade <= 9 ? `${gn[grade - 1]}年级${tn}` : ''
}

export function getAllPlanConfigs(): { grade: number; term: number }[] {
  const configs: { grade: number; term: number }[] = []
  for (let g = 1; g <= 9; g++) {
    configs.push({ grade: g, term: 1 })
    configs.push({ grade: g, term: 2 })
  }
  configs.push({ grade: 10, term: 1 })
  configs.push({ grade: 10, term: 2 })
  configs.push({ grade: 11, term: 1 })
  configs.push({ grade: 11, term: 2 })
  configs.push({ grade: 12, term: 1 })
  return configs
}

const COLLECTION_TO_GRADE_TERM: Record<string, { grade: number; term: number }> = {
  '高中必修（上册）': { grade: 10, term: 1 },
  '高中必修（下册）': { grade: 10, term: 2 },
  '高中选修（上册）': { grade: 11, term: 1 },
  '高中选修（中册）': { grade: 11, term: 2 },
  '高中选修（下册）': { grade: 12, term: 1 },
}

export async function ensureDefaultPlans(): Promise<void> {
  const user = useUserStore.getState().currentUser
  if (!user) return
  const existing = await db.studyPlans.where('userId').equals(user.id!).toArray()

  // Deduplicate: keep only one plan per grade-term, merge completedTitles
  const seen = new Map<string, number>() // key -> plan.id
  const toDelete: number[] = []
  for (const plan of existing) {
    const key = `${plan.grade}-${plan.term}`
    if (seen.has(key)) {
      toDelete.push(plan.id!)
    } else {
      seen.set(key, plan.id!)
    }
  }
  for (const id of toDelete) {
    await db.studyPlans.delete(id)
  }

  // Update existing high school plan names to add "高中" prefix
  const updated = await db.studyPlans.where('userId').equals(user.id!).toArray()
  for (const plan of updated) {
    if (plan.grade >= 10) {
      const newName = getPlanLabel(plan.grade, plan.term)
      if (plan.name !== newName) {
        await db.studyPlans.update(plan.id!, { name: newName })
      }
    }
  }

  const existingKeys = new Set(updated.map(p => `${p.grade}-${p.term}`))
  const configs = getAllPlanConfigs()
  const allPoems = await db.poems.toArray()

  for (const cfg of configs) {
    const key = `${cfg.grade}-${cfg.term}`
    if (existingKeys.has(key)) continue

    const matching = allPoems.filter(p => {
      if (p.collection_label) {
        const mapping = COLLECTION_TO_GRADE_TERM[p.collection_label]
        return mapping && mapping.grade === cfg.grade && mapping.term === cfg.term
      }
      return p.grade === cfg.grade && p.term === cfg.term
    })
    // Deduplicate by title
    const titleSet = new Set<string>()
    const titles: string[] = []
    for (const p of matching) {
      if (!titleSet.has(p.title)) {
        titleSet.add(p.title)
        titles.push(p.title)
      }
    }

    if (titles.length === 0) continue

    await db.studyPlans.add({
      userId: user.id!,
      name: getPlanLabel(cfg.grade, cfg.term),
      grade: cfg.grade,
      term: cfg.term,
      poemTitles: titles,
      completedTitles: [],
      createdAt: new Date(),
    })
  }
}

export async function togglePoemComplete(planId: number, title: string, completed: boolean): Promise<void> {
  const plan = await db.studyPlans.get(planId)
  if (!plan) return
  const user = useUserStore.getState().currentUser
  if (!user) return

  // Update plan's completed list
  const set = new Set(plan.completedTitles)
  if (completed) set.add(title)
  else set.delete(title)
  await db.studyPlans.update(planId, { completedTitles: [...set] })

  // When marking complete, also create a review record for Ebbinghaus
  if (completed) {
    const existing = await db.reviewRecords.where('userId').equals(user.id!).and(r => r.poemTitle === title).first()
    if (!existing) {
      const poem = await db.poems.where('title').equals(title).first()
      const now = new Date()
      await db.reviewRecords.add({
        userId: user.id!,
        poemTitle: title,
        poemAuthor: poem?.author || '',
        stage: 0,
        lastReviewedAt: now,
        nextReviewAt: getNextReviewDate(0, now),
        reviewCount: 0,
      })
    }
  } else {
    // When unmarking, remove the review record too
    const rec = await db.reviewRecords.where('userId').equals(user.id!).and(r => r.poemTitle === title).first()
    if (rec?.id) await db.reviewRecords.delete(rec.id)
  }
}

export async function resetPlanProgress(planId: number): Promise<void> {
  const plan = await db.studyPlans.get(planId)
  if (!plan) return
  const user = useUserStore.getState().currentUser
  if (!user) return

  // Remove all review records for this plan's poems
  for (const title of plan.completedTitles || []) {
    const rec = await db.reviewRecords.where('userId').equals(user.id!).and(r => r.poemTitle === title).first()
    if (rec?.id) await db.reviewRecords.delete(rec.id)
  }

  await db.studyPlans.update(planId, { completedTitles: [] })
}
