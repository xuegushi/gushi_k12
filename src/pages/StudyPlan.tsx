import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db } from '../lib/db'
import { ensureDefaultPlans, togglePoemComplete, resetPlanProgress } from '../lib/studyPlan'
import { getNextReviewDate } from '../lib/recitation'
import PoemContent from '../components/PoemContent'
import { Check, RotateCcw, ChevronRight, Library, Volume2, X } from 'lucide-react'

export default function StudyPlan() {
  var navigate = useNavigate()
  var planName = useParams().planName
  var currentUser = useUserStore(function(s) { return s.currentUser })
  var poems = useStore(function(s) { return s.poems })
  var [plans, setPlans] = useState<any[]>([])
  var [selected, setSelected] = useState<any | null>(null)
  var [loading, setLoading] = useState(true)
  var [recitePoem, setRecitePoem] = useState<any | null>(null)

  useEffect(function() {
    var user = currentUser
    if (!user) { user = useUserStore.getState().currentUser; if (!user) { setLoading(false); return } }
    ensureDefaultPlans().then(function() {
      db.studyPlans.where('userId').equals(user.id!).toArray().then(function(all) {
        setPlans(all)
        setLoading(false)
        if (planName) {
          var p = all.find(function(x) { return x.name === decodeURIComponent(planName) })
          if (p) setSelected(p)
        }
      })
    })
  }, [currentUser, planName])

  function pct(p: any) { return Math.round(((p.completedTitles?.length || 0) / (p.poemTitles?.length || 1)) * 100) }

  async function handleToggle(title: string, checked: boolean) {
    if (!selected) return
    await togglePoemComplete(selected.id!, title, checked)
    var updated = await db.studyPlans.get(selected.id!)
    setSelected(updated)
    setPlans(await db.studyPlans.where('userId').equals(currentUser!.id!).toArray())
  }

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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
        </div>
        {recitePoem ? reciteDialog(recitePoem, function(r) { finishRecite(r) }, function() { setRecitePoem(null) }) : null}
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
          {selected?.poemTitles?.map(function(title, idx) {
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
      {recitePoem ? reciteDialog(recitePoem, function(r) { finishRecite(r) }, function() { setRecitePoem(null) }) : null}
    </div>
  )
}

function reciteDialog(poem: any, onResult: Function, onClose: Function) {
  if (!poem) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={function() { onClose() }}>
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={function(e) { e.stopPropagation() }}>
        <div className="p-4 lg:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={function() { onClose() }} className="text-sm text-muted-foreground">&times; 关闭</button>
            <div className="flex-1" />
            <button onClick={function() { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(poem.content.join('，')); u.lang = 'zh-CN'; u.rate = 0.85; window.speechSynthesis.speak(u) } }} className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium">
              <Volume2 className="h-3.5 w-3.5 text-primary" /> 朗读
            </button>
          </div>
          <div className="text-center py-2 border-b">
            <h2 className="text-lg font-bold font-poem">{poem.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{poem.dynasty} · {poem.author}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4">
            <PoemContent content={poem.content} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={function() { onResult(false) }} className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3 text-sm text-red-600 font-medium">
              <X className="h-4 w-4 inline mr-1" /> 忘记了
            </button>
            <button onClick={function() { onResult(true) }} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-3 text-sm text-emerald-600 font-medium">
              <Check className="h-4 w-4 inline mr-1" /> 记住了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
