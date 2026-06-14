import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db } from '../lib/db'
import { ensureDefaultPlans, resetPlanProgress } from '../lib/studyPlan'
import { getNextReviewDate } from '../lib/recitation'
import ReciteDialog from '../components/ReciteDialog'
import { Check, RotateCcw, ChevronRight, Library } from 'lucide-react'

export default function StudyPlan() {
  var navigate = useNavigate()
  var planName = useParams().planName
  var currentUser = useUserStore(function(s) { return s.currentUser })
  var poems = useStore(function(s) { return s.poems })
  var [plans, setPlans] = useState<any[]>([])
  var [selected, setSelected] = useState<any | null>(null)
  var [loading, setLoading] = useState(true)
  var [recitePoem, setRecitePoem] = useState<any | null>(null)
  var [tab, setTab] = useState('plan')
  var [dueReviews, setDueReviews] = useState<any[]>([])
  var [reviewIdx, setReviewIdx] = useState(0)
  var [reviewDone, setReviewDone] = useState(false)

  useEffect(function() {
    var user = currentUser
    if (!user) { user = useUserStore.getState().currentUser; if (!user) { setLoading(false); return } }
    ensureDefaultPlans().then(function() {
      db.studyPlans.where('userId').equals(user!.id!).toArray().then(function(all) {
        setPlans(all)
        setLoading(false)
        if (planName) {
          var p = all.find(function(x) { return x.name === decodeURIComponent(planName || '') })
          if (p) setSelected(p)
        }
      })
    })
  }, [currentUser, planName])

  useEffect(function() {
    if (tab !== 'review' || !currentUser) return
    db.reviewRecords.where('userId').equals(currentUser.id!).toArray().then(function(all) {
      var today = new Date()
      today.setHours(0, 0, 0, 0)
      var due = all.filter(function(r) { return new Date(r.nextReviewAt) <= today && r.stage <= 6 })
      due.sort(function(a, b) { return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime() })
      setDueReviews(due)
      setReviewIdx(0)
      setReviewDone(due.length === 0)
    })
  }, [tab, currentUser])

  function pct(p: any) { return Math.round(((p.completedTitles?.length || 0) / (p.poemTitles?.length || 1)) * 100) }

  async function handleReset() {
    if (!selected) return
    await resetPlanProgress(selected.id!)
    setSelected(await db.studyPlans.get(selected.id!))
    setPlans(await db.studyPlans.where('userId').equals(currentUser!.id!).toArray())
  }

  function startRecite(title: string) {
    var poem = poems.find(function(p) { return p.title === title })
    if (poem) setRecitePoem(poem)
  }

  var handleReviewResult = async function(record: any, remembered: boolean) {
    if (!record) return
    var ns = remembered ? Math.min(record.stage + 1, 6) : 0
    if (ns >= 6) { await db.reviewRecords.delete(record.id) }
    else { await db.reviewRecords.update(record.id, { stage: ns, lastReviewedAt: new Date(), nextReviewAt: getNextReviewDate(ns, new Date()), reviewCount: (record.reviewCount || 0) + 1 }) }
    if (reviewIdx + 1 >= dueReviews.length) { setReviewDone(true) }
    else { setReviewIdx(function(i) { return i + 1 }) }
  }

  var finishRecite = async function(remembered: boolean) {
    if (!recitePoem || !currentUser) return
    var existing = await db.reviewRecords.where({ userId: currentUser.id, poemTitle: recitePoem.title }).first()
    var now = new Date()
    var stage = 0
    var reviewCount = 1
    if (existing) {
      stage = remembered ? Math.min(existing.stage + 1, 6) : 0
      reviewCount = (existing.reviewCount || 0) + 1
      await db.reviewRecords.update(existing.id!, { stage: stage, lastReviewedAt: now, nextReviewAt: getNextReviewDate(stage, now), reviewCount: reviewCount })
    } else {
      stage = remembered ? 1 : 0
      await db.reviewRecords.add({ userId: currentUser!.id!, poemTitle: recitePoem.title, poemAuthor: recitePoem.author || '', stage: stage, lastReviewedAt: now, nextReviewAt: getNextReviewDate(stage, now), reviewCount: 1 })
    }
    if (selected && remembered) {
      var titles = selected.completedTitles || []
      if (!titles.includes(recitePoem.title)) {
        titles.push(recitePoem.title)
        await db.studyPlans.update(selected.id, { completedTitles: titles })
        setSelected({ ...selected, completedTitles: [...titles] })
      }
    }
    setRecitePoem(null)
  }

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">加载中...</div>
  if (!loading && plans.length === 0) return <div className="py-16 text-center text-sm text-muted-foreground">暂无计划</div>
  if (planName && !selected) return <div className="py-16 text-center text-sm text-muted-foreground">计划未找到</div>

  if (!planName) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
            <Library className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold">学习</h1>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          <button onClick={function() { setTab('plan') }}
            className={'px-5 py-2 text-sm font-medium rounded-md ' + (tab === 'plan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>学习计划</button>
          <button onClick={function() { setTab('review') }}
            className={'px-5 py-2 text-sm font-medium rounded-md ' + (tab === 'review' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>复习</button>
        </div>
        {tab === 'plan' ? <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {plans.map(function(p) {
            return (
              <button key={p.id} onClick={function() { navigate('/study-plan/' + encodeURIComponent(p.name)) }}
                className="group text-left rounded-xl border bg-card p-4 card-hover">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{p.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: pct(p) + '%' }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{pct(p)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.completedTitles?.length || 0}/{p.poemTitles?.length || 0} 首</p>
              </button>
            )
          })}
          </div> : null}
        {tab === 'review' ? <div className="space-y-3">
          {reviewDone ? <div className="text-center py-8 text-sm text-muted-foreground"><p>今日复习已完成</p></div>
          : dueReviews.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">暂无待复习</div>
          : <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{reviewIdx + 1}/{dueReviews.length}</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: ((reviewIdx + 1) / dueReviews.length) * 100 + '%' }} />
            </div>
            <div className="rounded-xl border bg-card p-4 text-center space-y-2">
              <h2 className="text-lg font-bold font-poem">{dueReviews[reviewIdx]?.poemTitle}</h2>
              <p className="text-xs text-muted-foreground">{dueReviews[reviewIdx]?.poemAuthor}</p>
              <div className="flex justify-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">阶段{dueReviews[reviewIdx]?.stage}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={function() { handleReviewResult(dueReviews[reviewIdx], false) }}
                className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2.5 text-sm text-red-600 font-medium">
                忘记了
              </button>
              <button onClick={function() { handleReviewResult(dueReviews[reviewIdx], true) }}
                className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-2.5 text-sm text-emerald-600 font-medium">
                记住了
              </button>
            </div>
          </div>}
        </div> : null}
        {recitePoem ? <ReciteDialog poem={recitePoem} onResult={function(r) { finishRecite(r) }} onClose={function() { setRecitePoem(null) }} /> : null}
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3 animate-fade-up">
        <div className="flex items-center gap-2">
          <button onClick={function() { navigate('/study-plan') }} className="text-sm text-primary">&larr; 返回</button>
          <h2 className="font-medium flex-1">{selected?.name}</h2>
          <button onClick={handleReset} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
            <RotateCcw className="h-3 w-3" />重置
          </button>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: pct(selected) + '%' }} />
        </div>
        <p className="text-xs text-muted-foreground text-right">{selected?.completedTitles?.length || 0}/{selected?.poemTitles?.length || 0} 已完成</p>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {selected?.poemTitles?.map(function(title: string, idx: number) {
            var done = selected?.completedTitles?.includes(title)
            return (
              <div key={title + '-' + idx} className={'rounded-xl border p-5 card-hover cursor-pointer transition-colors ' + (done ? 'bg-muted/30 border-muted' : 'bg-card')}>
                <div className="flex items-center gap-3">
                  <div className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ' + (done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30')} onClick={function() { startRecite(title) }}>
                    {done && <Check className="h-4 w-4" />}
                  </div>
                  <button onClick={function() { startRecite(title) }} className={'text-base text-left truncate hover:text-primary transition-colors flex-1 ' + (done ? 'line-through text-muted-foreground/60' : '')}>{title}</button>
                  <button onClick={function() { startRecite(title) }}>
                    <Library className={'h-5 w-5 shrink-0 ' + (done ? 'text-muted-foreground/30' : 'text-muted-foreground/50')} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {recitePoem ? <ReciteDialog poem={recitePoem} onResult={function(r) { finishRecite(r) }} onClose={function() { setRecitePoem(null) }} /> : null}
    </div>
  )
}
