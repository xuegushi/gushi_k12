import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db, type ReviewRecord } from '../lib/db'
import { getNextReviewDate, getMaxStage } from '../lib/recitation'
import { Check, X, RotateCcw, Volume2 } from 'lucide-react'
import PoemContent from '../components/PoemContent'

const STAGE_LABELS = ['第1天', '第2天', '第4天', '第7天', '第15天', '第30天', '第60天']
const GRADE_FULL = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']

export default function Review() {
  const poems = useStore(s => s.poems)
  const loadReviewRecords = useStore(s => s.loadReviewRecords)
  const [searchParams] = useSearchParams()
  const poemTitle = searchParams.get('poem')

  // If coming from a specific poem, show its content directly
  const targetPoem = poemTitle ? poems.find(p => p.title === decodeURIComponent(poemTitle)) : null

  const [records, setRecords] = useState<(ReviewRecord & { poem?: any })[]>([])
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (targetPoem) {
      return
    }
    loadToday()
  }, [])

  const loadToday = async () => {
    const user = useUserStore.getState().currentUser
    if (!user) return
    const all = await db.reviewRecords.where('userId').equals(user.id!).toArray()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = all
      .filter(r => new Date(r.nextReviewAt) <= today && r.stage <= getMaxStage())
      .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
    const enriched = due.map(r => ({ ...r, poem: poems.find(p => p.title === r.poemTitle) }))
    setRecords(enriched)
    if (enriched.length === 0) setDone(true)
  }

  const handleReview = async (result: 'remembered' | 'forgotten') => {
    const record = records[idx]
    if (!record) return
    const ns = result === 'remembered' ? Math.min(record.stage + 1, getMaxStage() + 1) : 0
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
    setReveal(false)
    if (idx + 1 >= records.length) setDone(true)
    else setIdx(i => i + 1)
    loadReviewRecords()
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      window.speechSynthesis.speak(u)
    }
  }

  // Recitation mode from poem detail
  if (targetPoem) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-2">
          <Link to={'/poem/' + encodeURIComponent(targetPoem.title)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-5 w-5" />
          </Link>
          <h1 className="font-bold">背诵 - {targetPoem.title}</h1>
        </div>

        <div className="text-center py-4 border-b">
          <h2 className="text-xl font-bold font-poem">{targetPoem.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{targetPoem.dynasty} · {targetPoem.author}</p>
          <button onClick={function() { speak(targetPoem.content.join('，')) }} className="mt-2 inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium card-hover">
            <Volume2 className="h-3.5 w-3.5 text-primary" /> 朗读
          </button>
        </div>

        <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4 lg:p-6">
          <PoemContent content={targetPoem.content} onModeChange={function() {}} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={function() { handleReview('forgotten') }} className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3 text-sm text-red-600 font-medium">
            <X className="h-4 w-4 inline mr-1" /> 不熟
          </button>
          <button onClick={function() { handleReview('remembered') }} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-3 text-sm text-emerald-600 font-medium">
            <Check className="h-4 w-4 inline mr-1" /> 背出了
          </button>
        </div>
      </div>
    )
  }

  // Default review mode
  if (done) {
    return (
      <div className="py-20 text-center space-y-3 animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="font-medium">今日复习完成</p>
        <p className="text-sm text-muted-foreground">太棒了，继续保持！</p>
        <Link to="/" className="inline-block text-sm text-primary underline mt-2">返回首页</Link>
      </div>
    )
  }

  const current = records[idx]

  if (!current) {
    return (
      <div className="py-20 text-center space-y-3 animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
          <RotateCcw className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium">暂无待复习</p>
        <p className="text-sm text-muted-foreground">去诗词列表开始学习吧</p>
        <Link to="/poems" className="inline-block text-sm text-primary underline mt-2">浏览诗词</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">今日复习</h1>
        <span className="text-sm text-muted-foreground">{idx + 1}/{records.length}</span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((idx + 1) / records.length) * 100}%` }} />
      </div>

      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <h2 className="text-xl font-bold font-poem">{current.poemTitle}</h2>
        <p className="text-sm text-muted-foreground">{current.poemAuthor}</p>
        <div className="flex justify-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{STAGE_LABELS[current.stage]}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">复习 {current.reviewCount || 0} 次</span>
        </div>
        {current.poem && (
          <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4 mt-2">
            {current.poem.content.map((line, i) => (
              <p key={i} className="text-sm leading-7 font-poem">{line}</p>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleReview('forgotten')}
          className="flex flex-col items-center gap-1 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-red-600 card-hover"
        >
          <X className="h-5 w-5" />
          <span className="text-sm font-medium">忘记了</span>
        </button>
        <button
          onClick={() => handleReview('remembered')}
          className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-emerald-600 card-hover"
        >
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">记住了</span>
        </button>
      </div>
    </div>
  )
}
