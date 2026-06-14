import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { RotateCcw, Library, TrendingUp, ChevronRight } from 'lucide-react'

const GRADE_MAP = [
  { grade: 1, name: '一', full: '一年级', color: 'from-emerald-400 to-emerald-500' },
  { grade: 2, name: '二', full: '二年级', color: 'from-teal-400 to-teal-500' },
  { grade: 3, name: '三', full: '三年级', color: 'from-cyan-400 to-cyan-500' },
  { grade: 4, name: '四', full: '四年级', color: 'from-sky-400 to-sky-500' },
  { grade: 5, name: '五', full: '五年级', color: 'from-blue-400 to-blue-500' },
  { grade: 6, name: '六', full: '六年级', color: 'from-indigo-400 to-indigo-500' },
  { grade: 7, name: '七', full: '七年级', color: 'from-violet-400 to-violet-500' },
  { grade: 8, name: '八', full: '八年级', color: 'from-purple-400 to-purple-500' },
  { grade: 9, name: '九', full: '九年级', color: 'from-fuchsia-400 to-fuchsia-500' },
  { grade: 10, name: '高一', full: '高一', color: 'from-pink-400 to-pink-500' },
  { grade: 11, name: '高二', full: '高二', color: 'from-rose-400 to-rose-500' },
  { grade: 12, name: '高三', full: '高三', color: 'from-orange-400 to-orange-500' },
]

export default function Home() {
  const poems = useStore(s => s.poems)
  const dailyReviewCount = useStore(s => s.dailyReviewCount)
  const loadReviewRecords = useStore(s => s.loadReviewRecords)

  useEffect(() => { loadReviewRecords() }, [])

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 lg:p-8 text-primary-foreground mb-6 lg:mb-8">
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight font-poem">古诗学习</h1>
          <p className="mt-1.5 text-sm lg:text-base opacity-85">
            收录 <span className="font-semibold">{poems.length}</span> 首古诗词 · 覆盖 1-12 年级
          </p>
        </div>
        <div className="absolute right-4 top-4 text-7xl lg:text-8xl opacity-8 select-none font-poem">诗</div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <Link
          to="/study-plan"
          className="group relative overflow-hidden rounded-xl border bg-card p-4 lg:p-5 card-hover"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">学习计划</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">按年级/分册系统学习</p>
            </div>
          </div>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
        </Link>

        <Link
          to="/review"
          className="group relative overflow-hidden rounded-xl border bg-card p-4 lg:p-5 card-hover"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">今日复习</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                {dailyReviewCount > 0
                  ? <span className="text-primary font-medium">{dailyReviewCount} 首待复习</span>
                  : '暂无待复习'}
              </p>
            </div>
          </div>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
        </Link>

        <Link
          to="/progress"
          className="group relative overflow-hidden rounded-xl border bg-card p-4 lg:p-5 card-hover"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">学习进度</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">查看学习统计和完成情况</p>
            </div>
          </div>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
        </Link>
      </div>

      {/* Grade grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-medium">按年级浏览</h2>
          <span className="text-xs text-muted-foreground">选择年级开始学习</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {GRADE_MAP.map(({ grade, full, color }) => {
            const count = poems.filter(p => p.grade === grade).length
            return (
              <Link
                key={grade}
                to={`/poems?grade=${grade}`}
                className="group rounded-xl border bg-card p-4 card-hover"
              >
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${color} mb-3 opacity-70`} />
                <p className="font-semibold text-sm">{full}</p>
                <p className="text-xs lg:text-sm text-muted-foreground mt-1">{count} 首</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
