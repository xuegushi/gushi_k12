import poemsData from '../data/poems.json'
import poemsHighschoolData from '../data/poems_highschool.json'
import { db } from './db'

const BATCH_SIZE = 100

export async function initPoems() {
  const DATA_VERSION = '11'
  const storedVersion = localStorage.getItem('poems_data_version')

  if (storedVersion !== DATA_VERSION) {
    await db.poems.clear()
    localStorage.setItem('poems_data_version', DATA_VERSION)
  }

  const count = await db.poems.count()
  const totalCount = poemsData.length + poemsHighschoolData.length
  if (count === totalCount) return

  if (count > 0) await db.poems.clear()

  const normalData = poemsData as any[]
  for (let i = 0; i < normalData.length; i += BATCH_SIZE) {
    const batch = normalData.slice(i, i + BATCH_SIZE)
    await db.poems.bulkAdd(batch)
  }

  const highschoolData = poemsHighschoolData as any[]
  for (let i = 0; i < highschoolData.length; i += BATCH_SIZE) {
    const batch = highschoolData.slice(i, i + BATCH_SIZE)
    await db.poems.bulkAdd(batch)
  }

  console.log(`Initialized ${normalData.length + highschoolData.length} poems`)
}

export async function getPoems(options?: {
  grade?: number
  type?: string
  difficulty?: number
}) {
  let collection = db.poems.toCollection()
  if (options?.grade) collection = db.poems.where('grade').equals(options.grade)
  let poems = await collection.toArray()
  if (options?.type) poems = poems.filter(p => p.type === options.type)
  if (options?.difficulty) poems = poems.filter(p => p.difficulty === options.difficulty)
  return poems
}

export async function getPoemByTitle(title: string) {
  return db.poems.where('title').equals(title).first()
}
