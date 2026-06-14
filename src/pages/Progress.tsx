import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db } from '../lib/db'
import { Search, Check, BookOpen, Flame, CalendarDays, TrendingUp, History, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TYPES = ['全部', '诗', '词', '文言文']
const GRADE_NAMES = ['全部', '一', '二', '三', '四', '五', '六', '七', '八', '九', '高一', '高二', '高三']
const GRADE_FULL = ['全部', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']

export default function Progress() {
  var navigate = useNavigate()
  var poems = useStore(s => s.poems)
  var userId = useUserStore(s => s.currentUser?.id)

  var [tab, setTab] = useState('progress')
  var [grade, setGrade] = useState(0)
  var [type, setType] = useState('全部')
  var [search, setSearch] = useState('')
  var [completed, setCompleted] = useState<Set<string>>(new Set())
  var [dailyStats, setDailyStats] = useState<Record<string, number>>({})
  var [weeklyTotal, setWeeklyTotal] = useState(0)
  var [monthlyTotal, setMonthlyTotal] = useState(0)
  var [streak, setStreak] = useState(0)
  var [records, setRecords] = useState<any[]>([])
  var [recordPage, setRecordPage] = useState(1)
  var [recordTotal, setRecordTotal] = useState(0)
  var pageSize = 20

  useEffect(function() {
    if (!userId) return
    db.studyPlans.where('userId').equals(userId).toArray().then(function(plans) {
      var set = new Set<string>()
      for (var p of plans) {
        for (var t of (p.completedTitles || [])) set.add(t)
      }
      setCompleted(set)
    })
  }, [userId])

  useEffect(function() {
    if (!userId) return
    db.reviewRecords.where('userId').equals(userId).toArray().then(function(records) {
      var dayCount: Record<string, number> = {}
      var now = new Date()
      var sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      var weekSum = 0
      var monthSum = 0
      var streakCount = 0

      for (var r of records) {
        var d = new Date(r.lastReviewedAt)
        var key = d.toISOString().slice(0, 10)
        dayCount[key] = (dayCount[key] || 0) + 1
        if (d >= sevenDaysAgo) weekSum++
        if (d >= monthStart) monthSum++
      }

      var today = new Date(now.toISOString().slice(0, 10))
      for (var i = 0; i < 365; i++) {
        var checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        var key = checkDate.toISOString().slice(0, 10)
        if (dayCount[key] && dayCount[key] > 0) streakCount++
        else if (i > 0) break
      }

      var last7: Record<string, number> = {}
      for (var i = 6; i >= 0; i--) {
        var d = new Date(now)
        d.setDate(d.getDate() - i)
        var key = d.toISOString().slice(0, 10)
        last7[key] = dayCount[key] || 0
      }

      setDailyStats(last7)
      setWeeklyTotal(weekSum)
      setMonthlyTotal(monthSum)
      setStreak(streakCount)
    })
  }, [userId])

  // Load history records with pagination
  var loadRecords = function(page: number) {
    if (!userId) return
    db.reviewRecords.where('userId').equals(userId).reverse().toArray().then(function(all) {
      setRecordTotal(all.length)
      var start = (page - 1) * pageSize
      setRecords(all.slice(start, start + pageSize))
      setRecordPage(page)
    })
  }

  useEffect(function() {
    if (tab === 'records') loadRecords(1)
  }, [tab, userId])

  var totalPages = Math.ceil(recordTotal / pageSize)

  var filtered = poems.filter(function(p) {
    if (grade > 0 && p.grade !== grade) return false
    if (type !== '全部' && p.type !== type) return false
    if (search) {
      var q = search.toLowerCase()
      return p.title.includes(q) || p.author.includes(q)
    }
    return true
  })

  var totalDone = completed.size
  var total = poems.length
  var pct = total > 0 ? Math.round((totalDone / total) * 100) : 0

  var maxVal = Math.max(1, ...Object.values(dailyStats))
  var dayNames = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-4 page-enter max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
          <BookOpen className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">学习进度</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
        <button onClick={function() { setTab('progress') }}
          className={tab === 'progress' ? 'px-4 py-2 text-sm font-medium rounded-md bg-card text-foreground shadow-sm flex items-center gap-1.5' : 'px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground flex items-center gap-1.5'}>
          <TrendingUp className="h-4 w-4" /> 进度
        </button>
        <button onClick={function() { setTab('records') }}
          className={tab === 'records' ? 'px-4 py-2 text-sm font-medium rounded-md bg-card text-foreground shadow-sm flex items-center gap-1.5' : 'px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground flex items-center gap-1.5'}>
          <History className="h-4 w-4" /> 记录
        </button>
      </div>

      {tab === 'progress' ? (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-lg font-bold">{totalDone}<span className="text-xs font-normal text-muted-foreground">/{total}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{pct}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: pct + '%' }} />
          </div>

          {/* Weekly activity */}
          <div className="rounded-xl border bg-card p-3 lg:p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" /> 本周学习
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>本周 {weeklyTotal} 次</span>
                <span>本月 {monthlyTotal} 次</span>
                <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" /> {streak} 天</span>
              </div>
            </div>
            <div className="flex items-end gap-px h-12 w-full">
              {Object.entries(dailyStats).map(function([date, count]) {
                var h = Math.max(4, (count / maxVal) * 40)
                var d = new Date(date)
                var isToday = date === new Date().toISOString().slice(0, 10)
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-px min-w-0">
                    <span className="text-[8px] text-muted-foreground leading-none">{count || ''}</span>
                    <div className={'w-full rounded-sm transition-all min-h-[3px] ' + (count > 0 ? 'bg-indigo-500' : 'bg-muted')} style={{ height: h + 'px' }} />
                    <span className={'text-[8px] leading-none ' + (isToday ? 'text-primary font-medium' : 'text-muted-foreground')}>{dayNames[d.getDay()]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Type / level stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">学习概况</h3>
            <div className="grid grid-cols-3 gap-3">
              {[['诗'], ['词'], ['文言文']].map(function([label]) {
                var t = poems.filter(function(p) { return p.type === label }).length
                var d = poems.filter(function(p) { return p.type === label && completed.has(p.title) }).length
                var pp = t > 0 ? Math.round(d / t * 100) : 0
                return (
                  <div key={label} className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-base font-bold mt-0.5">{d}/{t}</p>
                    <div className="h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: pp + '%' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['小学', [1, 2, 3, 4, 5, 6]], ['初中', [7, 8, 9]], ['高中', [10, 11, 12]]].map(function([label, grades]) {
                var t = poems.filter(function(p) { return grades.includes(p.grade) }).length
                var d = poems.filter(function(p) { return grades.includes(p.grade) && completed.has(p.title) }).length
                var pp = t > 0 ? Math.round(d / t * 100) : 0
                return (
                  <div key={label} className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-base font-bold mt-0.5">{d}/{t}</p>
                    <div className="h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: pp + '%' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Search & filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索诗词..." value={search}
              onChange={function(e) { setSearch(e.target.value) }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
            {TYPES.map(function(t) {
              return (
                <button key={t} onClick={function() { setType(t) }}
                  className={type === t ? 'px-2.5 py-1 text-xs font-medium rounded-md bg-card text-foreground shadow-sm' : 'px-2.5 py-1 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground'}>
                  {t}
                </button>
              )
            })}
          </div>
          <div className="flex gap-1.5 flex-wrap pb-1">
            {GRADE_NAMES.map(function(name, i) {
              return (
                <button key={i} onClick={function() { setGrade(i) }}
                  className={'shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ' + (grade === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                  {name}
                </button>
              )
            })}
          </div>

          {/* Poem grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map(function(p) {
              var done = completed.has(p.title)
              return (
            <div key={p.title + '-' + p.author + '-' + p.grade}
              onClick={function() { navigate('/poem/' + encodeURIComponent(p.title)) }}
              className={'rounded-xl border p-2.5 cursor-pointer card-hover ' + (done ? 'bg-card border-emerald-200 dark:border-emerald-900/50' : 'bg-card')}>
              <div className="flex items-center gap-1.5">
                {done && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                <h3 className={'text-sm font-semibold truncate ' + (done ? 'text-emerald-700 dark:text-emerald-300' : '')}>{p.title}</h3>
                <span className="text-[10px] text-muted-foreground shrink-0">{p.dynasty} · {p.author}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.type}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{GRADE_FULL[p.grade]}</span>
              </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="col-span-full text-center py-16 text-sm text-muted-foreground">没有匹配的诗词</div>}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{recordTotal} 条复习记录</p>
          {records.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">暂无记录</div>
          ) : (
            <div className="space-y-1">
              {records.map(function(r, i) {
                var d = new Date(r.lastReviewedAt)
                var month = d.getMonth() + 1
                var day = d.getDate()
                var hours = String(d.getHours()).padStart(2, '0')
                var mins = String(d.getMinutes()).padStart(2, '0')
                var dateStr = month + '/' + day + ' ' + hours + ':' + mins
                var stageLabel = ['第1天', '第2天', '第4天', '第7天', '第15天', '第30天', '第60天'][r.stage]
                if (!stageLabel) stageLabel = '已完成'
                return (
                  <div key={r.id || i} className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{r.poemTitle}</span>
                      <span className="text-xs text-muted-foreground shrink-0">({r.poemAuthor})</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0 ml-2">
                      <span className="block">{dateStr}</span>
                      <span className="block">{stageLabel}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={function() { if (recordPage > 1) loadRecords(recordPage - 1) }}
                className={'px-2 py-1 text-xs rounded-md border ' + (recordPage <= 1 ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground')}>
                <ChevronLeft className="h-3.5 w-3.5 inline" /> 上一页
              </button>
              <span className="text-xs text-muted-foreground">{recordPage}/{totalPages}</span>
              <button onClick={function() { if (recordPage < totalPages) loadRecords(recordPage + 1) }}
                className={'px-2 py-1 text-xs rounded-md border ' + (recordPage >= totalPages ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground')}>
                下一页 <ChevronRight className="h-3.5 w-3.5 inline" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
