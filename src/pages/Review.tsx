import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db, type ReviewRecord } from '../lib/db'
import { getNextReviewDate, getMaxStage } from '../lib/recitation'
import { Check, X, RotateCcw, Volume2, BookOpen } from 'lucide-react'
import PoemContent from '../components/PoemContent'

const STAGE_LABELS = ['第1天', '第2天', '第4天', '第7天', '第15天', '第30天', '第60天']

export default function Review() {
  var poems = useStore(function(s) { return s.poems })
  var loadReviewRecords = useStore(function(s) { return s.loadReviewRecords })
  var [searchParams] = useSearchParams()
  var poemTitle = searchParams.get('poem')

  // If coming from a specific poem, show its content directly
  var targetPoem = poemTitle ? poems.find(function(p) { return p.title === decodeURIComponent(poemTitle || '') }) : null

  var [records, setRecords] = useState<(ReviewRecord & { poem?: any })[]>([])
  var [idx, setIdx] = useState(0)
  var [done, setDone] = useState(false)

  useEffect(function() {
    if (targetPoem) { return }
    loadToday()
  }, [])

  var loadToday = async function() {
    var user = useUserStore.getState().currentUser
    if (!user) return
    var all = await db.reviewRecords.where('userId').equals(user.id!).toArray()
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    var due = all.filter(function(r) { return new Date(r.nextReviewAt) <= today && r.stage <= getMaxStage() })
    due.sort(function(a, b) { return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime() })
    var enriched = due.map(function(r) { return { ...r, poem: poems.find(function(p) { return p.title === r.poemTitle }) } })
    setRecords(enriched)
    if (enriched.length > 0) { setDone(false); return }
    // No due reviews - show upcoming queue instead
    var upcoming = all.filter(function(r) { return r.stage <= getMaxStage() })
    upcoming.sort(function(a, b) { return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime() })
    var upcomingEnriched = upcoming.map(function(r) { return { ...r, poem: poems.find(function(p) { return p.title === r.poemTitle }) } })
    setRecords(upcomingEnriched)
    if (upcomingEnriched.length === 0) setDone(true)
    else setIdx(-1) // -1 means showing queue, not active review
  }

  var handleReview = async function(result: string) {
    var record = records[idx]
    if (!record) return
    var ns = result === 'remembered' ? Math.min(record.stage + 1, getMaxStage() + 1) : 0
    if (ns > getMaxStage()) {
      await db.reviewRecords.delete(record.id!)
    } else {
      await db.reviewRecords.update(record.id!, {
        stage: ns,
        lastReviewedAt: new Date(),
        nextReviewAt: getNextReviewDate(ns, new Date()),
        reviewCount: (record.reviewCount || 0) + 1,
      })
    }
    if (idx + 1 >= records.length) setDone(true)
    else setIdx(function(i) { return i + 1 })
    loadReviewRecords()
  }

  var speak = function(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      var u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      window.speechSynthesis.speak(u)
    }
  }

  // Recitation mode from poem detail
  var handleTargetReview = async function(remembered: boolean) {
    if (!targetPoem) return
    var user = useUserStore.getState().currentUser
    if (!user) return
    var existing = await db.reviewRecords.where({ userId: user.id, poemTitle: targetPoem.title }).first()
    var now = new Date()
    if (existing) {
      var ns = remembered ? Math.min(existing.stage + 1, getMaxStage() + 1) : 0
      if (ns > getMaxStage()) { await db.reviewRecords.delete(existing.id!) }
      else { await db.reviewRecords.update(existing.id!, { stage: ns, lastReviewedAt: now, nextReviewAt: getNextReviewDate(ns, now), reviewCount: (existing.reviewCount || 0) + 1 }) }
    } else {
      var ns = remembered ? 1 : 0
      await db.reviewRecords.add({ userId: user.id!, poemTitle: targetPoem.title, poemAuthor: targetPoem.author || '', stage: ns, lastReviewedAt: now, nextReviewAt: getNextReviewDate(ns, now), reviewCount: 1 })
    }
    loadReviewRecords()
  }

  if (targetPoem) {
    var tp = targetPoem
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-2">
          <Link to={'/poems/' + encodeURIComponent(tp.title)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
            <BookOpen className="h-4 w-4" />
          </div>
            <h1 className="text-lg font-bold">背诵 - {tp.title}</h1>
          </div>
        </div>

        <div className="text-center py-4 border-b">
          <h2 className="text-xl font-bold font-poem">{tp.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{tp.dynasty} · {tp.author}</p>
          <button onClick={function() { speak(tp.content.join('，')) }} className="mt-2 inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium card-hover">
            <Volume2 className="h-3.5 w-3.5 text-primary" /> 朗读
          </button>
        </div>

        <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4 lg:p-6">
          <PoemContent content={tp.content} onModeChange={function() {}} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={function() { handleTargetReview(false) }} className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3 text-sm text-red-600 font-medium">
            <X className="h-4 w-4 inline mr-1" /> 不熟
          </button>
          <button onClick={function() { handleTargetReview(true) }} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-3 text-sm text-emerald-600 font-medium">
            <Check className="h-4 w-4 inline mr-1" /> 背出了
          </button>
        </div>
      </div>
    )
  }

  // Default review mode
  if (done) {
    return (
      <div className="space-y-3 animate-fade-up">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold">今日复习</h1>
        </div>
        <div className="py-8 text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
            <Check className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="font-medium">今日复习完成</p>
          <p className="text-xs text-muted-foreground">太棒了，继续保持！</p>
          <Link to="/" className="inline-block text-xs text-primary underline mt-1">返回首页</Link>
        </div>
      </div>
    )
  }

  var current = records[idx]

  if (!current) {
    return (
      <div className="space-y-3 animate-fade-up">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold">今日复习</h1>
        </div>
        <div className="py-8 text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
            <RotateCcw className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">暂无待复习</p>
          <p className="text-xs text-muted-foreground">去诗词列表开始学习吧</p>
          <Link to="/poems" className="inline-block text-xs text-primary underline mt-1">浏览诗词</Link>
        </div>
      </div>
    )
  }

  var queueView = (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground mb-3">暂无今日到期的复习，以下是待复习列表：</p>
      <div className="space-y-1">
        {records.map(function(r, i) {
          var daysUntil = Math.ceil((new Date(r.nextReviewAt).getTime() - Date.now()) / 86400000)
          return (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
              <div>
                <span className="font-medium">{r.poemTitle}</span>
                <span className="text-xs text-muted-foreground ml-1">({r.poemAuthor})</span>
              </div>
              <span className="text-xs text-muted-foreground">{STAGE_LABELS[r.stage]} {daysUntil > 0 ? daysUntil + '天后' : '今天'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  var reviewContent = (
    <div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: ((idx + 1) / records.length) * 100 + '%' }} />
      </div>
      <div className="rounded-xl border bg-card p-4 text-center space-y-2">
        <h2 className="text-lg font-bold font-poem">{current.poemTitle}</h2>
        <p className="text-xs text-muted-foreground">{current.poemAuthor}</p>
        <div className="flex justify-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{STAGE_LABELS[current.stage]}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">复习 {current.reviewCount || 0} 次</span>
        </div>
            {current.poem && (
          <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-3 mt-1">
            {current.poem.content.map(function(line: string, i: number) {
              return <p key={i} className="text-sm leading-6 font-poem">{line}</p>
            })}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={function() { handleReview('forgotten') }}
          className="flex flex-col items-center gap-0.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2.5 text-red-600">
          <X className="h-4 w-4" />
          <span className="text-xs font-medium">忘记了</span>
        </button>
        <button onClick={function() { handleReview('remembered') }}
          className="flex flex-col items-center gap-0.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-2.5 text-emerald-600">
          <Check className="h-4 w-4" />
          <span className="text-xs font-medium">记住了</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
          <RotateCcw className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">{idx === -1 ? '待复习队列' : '今日复习'}</h1>
        <span className="text-xs text-muted-foreground ml-auto">{records.length} 首</span>
      </div>

      {idx === -1 ? queueView : reviewContent}
    </div>
  )
}
