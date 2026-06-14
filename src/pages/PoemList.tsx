import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Search, ChevronRight, BookOpen, Star } from 'lucide-react'

const TYPES = ['全部', '诗', '词', '文言文']
const GRADE_NAMES = ['全部', '一', '二', '三', '四', '五', '六', '七', '八', '九', '高一', '高二', '高三']
const GRADE_FULL = ['全部', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']

const DIFFICULTY_COLORS = ['', 'text-green-600', 'text-amber-600', 'text-red-600']
const DIFFICULTY_BG = ['', 'bg-green-100 dark:bg-green-900/30', 'bg-amber-100 dark:bg-amber-900/30', 'bg-red-100 dark:bg-red-900/30']

export default function PoemList() {
  const poems = useStore(s => s.poems)
  const poemsLoaded = useStore(s => s.poemsLoaded)
  const [searchParams] = useSearchParams()
  const gradeParam = searchParams.get('grade')

  const [grade, setGrade] = useState(gradeParam ? Number(gradeParam) : 0)
  const [type, setType] = useState('全部')
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState(0)

  // Compute filtered list directly on each render
  const filtered = poems.filter(p => {
    if (grade > 0 && p.grade !== grade) return false
    if (type !== '全部' && p.type !== type) return false
    if (diffFilter > 0 && p.difficulty !== diffFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.title.includes(q) || p.author.includes(q) || p.content.some(l => l.includes(q))
    }
    return true
  })

  if (!poemsLoaded || poems.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">诗词库</h1>
        <span className="text-xs text-muted-foreground">{filtered.length} 首</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索标题、作者或诗句..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* Type */}
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Difficulty */}
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {[{ v: 0, l: '全部' }, { v: 1, l: '简单' }, { v: 2, l: '中等' }, { v: 3, l: '困难' }].map(d => (
            <button
              key={d.v}
              onClick={() => setDiffFilter(d.v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                diffFilter === d.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {d.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grade */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {GRADE_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => setGrade(i)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              grade === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">共 {filtered.length} 首</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(p => {
            return (
              <Link
                key={p.title + '-' + p.author + '-' + p.grade}
                to={`/poem/${encodeURIComponent(p.title)}`}
                className="block rounded-xl border bg-card p-4 card-hover"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.dynasty} · {p.author}</p>
                  </div>
                </div>
                {p.content && (
                  <p className="text-xs text-muted-foreground/60 mt-2 line-clamp-2 leading-relaxed font-poem">
                    {Array.isArray(p.content) ? p.content.slice(0, 2).join('') : ''}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.type}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {GRADE_FULL[p.grade] || ''}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">没有找到匹配的诗词</p>
            <button onClick={() => { setSearch(''); setGrade(0); setType('全部'); setDiffFilter(0) }}
              className="mt-2 text-xs text-primary hover:underline">清除筛选</button>
          </div>
        )}
      </div>
    </div>
  )
}
