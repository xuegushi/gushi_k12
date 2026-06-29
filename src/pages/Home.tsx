import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { RotateCcw, Library, TrendingUp, ChevronRight, Wrench, Droplets, Puzzle, Edit3, Cherry, LayoutGrid, Grid3X3, Gamepad2 } from 'lucide-react'

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
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

        <Link
          to="/tools"
          className="group relative overflow-hidden rounded-xl border bg-card p-4 lg:p-5 card-hover"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">工具箱</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">翻译 · 朗读 · 字迹演练</p>
            </div>
          </div>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
        </Link>
      </div>

      {/* Games */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600">
            <Gamepad2 className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-medium">诗词游戏</h2>
          <span className="text-xs text-muted-foreground">趣味学诗词</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link to="/poem-sort" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 card-hover text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Puzzle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">诗词排序</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">拖拽还原诗句</p>
            </div>
          </Link>
          <Link to="/poem-fill" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 card-hover text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">诗词填空</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">选字填空白</p>
            </div>
          </Link>
          <Link to="/poem-chain" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 card-hover text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600">
              <Cherry className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">飞花令</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">含指定字的诗句</p>
            </div>
          </Link>
          <Link to="/poem-match" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 card-hover text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">连连看</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">上下句配对</p>
            </div>
          </Link>
          <Link to="/poem-puzzle" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 card-hover text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">诗词拼图</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">字块还原</p>
            </div>
          </Link>
          <Link to="/poem-rain" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 card-hover text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">诗词雨</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">矩阵雨动画</p>
            </div>
          </Link>
        </div>
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
                <p className="font-semibold text-sm">{full}</p>
                <p className="text-xs lg:text-sm text-muted-foreground mt-1 mb-3">{count} 首</p>
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${color} opacity-70`} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
