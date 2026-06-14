import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useSelectionStore } from '../store/selection'
import { useUserStore } from '../store/user'
import { db } from '../lib/db'
import { ArrowLeft, Volume2, Heart, BookOpen, User, GraduationCap, Play, ChevronDown, Star, Languages, Sparkles } from 'lucide-react'
import { PinyinText } from '../components/PinyinText'
import { chat } from '../lib/ai'
import { getNextReviewDate } from '../lib/recitation'
import ReciteDialog from '../components/ReciteDialog'

const GRADE_FULL = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']

export default function PoemDetail() {
  var { title } = useParams()
  var poems = useStore(function(s) { return s.poems })
  var poem = poems.find(function(p) { return p.title === decodeURIComponent(title || '') })

  var [tab, setTab] = useState('content')
  var [isFav, setIsFav] = useState(false)
  var [showPy, setShowPy] = useState(false)
  var [reciting, setReciting] = useState(false)
  var [aiLoading, setAiLoading] = useState('')
  var [aiContent, setAiContent] = useState<Record<string, string>>({})
  var navigate = useNavigate()
  var userId = useUserStore(function(s) { return s.currentUser?.id })

  useEffect(function() {
    if (!poem || !userId) return
    var p = poem
    db.favorites.where('userId').equals(userId).and(function(f) { return f.poemTitle === p.title }).first().then(function(f) { setIsFav(!!f) })
    useSelectionStore.getState().setPoemContext({
      title: p.title, author: p.author, content: p.content.join(''),
    })
    return function() { useSelectionStore.getState().setPoemContext(null) }
  }, [poem])

  var toggleFav = async function() {
    if (!poem || !userId) return
    var p = poem
    if (isFav) {
      var f = await db.favorites.where('userId').equals(userId).and(function(f) { return f.poemTitle === p.title }).first()
      if (f && f.id) await db.favorites.delete(f.id)
      setIsFav(false)
    } else {
      await db.favorites.add({ userId: userId, poemTitle: p.title, createdAt: new Date() })
      setIsFav(true)
    }
  }

  var speak = function(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      var u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'; u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  if (!poem) return <div className="py-24 text-center text-sm text-muted-foreground">诗词未找到</div>

  var p = poem

  var generateContent = async function(field: string, prompt: string) {
    if (!poem) return
    var aiConfigs = useStore.getState().aiConfigs
    var cfg = aiConfigs.find(function(c) { return c.enabled && c.apiKey })
    if (!cfg) return
    setAiLoading(field)
    try {
      var fullPrompt = prompt + '\n\n诗词：《' + p.title + '》' + p.author + '\n' + p.content.join('')
      var reply = await chat(cfg.platform, cfg.apiKey, [{ role: 'user', content: fullPrompt }], cfg.model)
      setAiContent(function(prev) { return { ...prev, [field]: reply } })
    } catch (err: any) {
      setAiContent(function(prev) { return { ...prev, [field]: '生成失败：' + err.message } })
    }
    setAiLoading('')
  }

  var handleRecite = async function(remembered: boolean) {
    if (!poem) return
    var user = useUserStore.getState().currentUser
    if (!user) return
    var existing = await db.reviewRecords.where({ userId: user.id, poemTitle: p.title }).first()
    var now = new Date()
    if (existing) {
      var ns = remembered ? Math.min(existing.stage + 1, 6) : 0
      if (ns >= 6) { await db.reviewRecords.delete(existing.id!) }
      else { await db.reviewRecords.update(existing.id!, { stage: ns, lastReviewedAt: now, nextReviewAt: getNextReviewDate(ns, now), reviewCount: (existing.reviewCount || 0) + 1 }) }
    } else {
      var ns = remembered ? 1 : 0
      await db.reviewRecords.add({ userId: user.id!, poemTitle: p.title, poemAuthor: p.author || '', stage: ns, lastReviewedAt: now, nextReviewAt: getNextReviewDate(ns, now), reviewCount: 1 })
    }
    setReciting(false)
  }

  var closeRecite = function() { setReciting(false) }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
        <div className="flex-1" />
        <button onClick={toggleFav} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Heart className={isFav ? 'fill-red-500 text-red-500 h-4 w-4' : 'h-4 w-4'} />
          {isFav ? '已收藏' : '收藏'}
        </button>
      </div>

      <div className="text-center py-6 lg:py-8 border-b mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold font-poem tracking-wide">{p.title}</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-2">{p.dynasty} · {p.author}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.type}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">{GRADE_FULL[p.grade]}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">难度 {p.difficulty}</span>
          {p.examFrequency > 0 && <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
            {Array.from({ length: Math.min(p.examFrequency, 5) }).map(function(_, i) { return <Star key={i} className="h-3 w-3 fill-current" /> })}
          </span>}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
          {['content', 'knowledge'].map(function(t) {
            var active = tab === t
            return (
              <button key={t} onClick={function() { setTab(t) }}
                className={active ? 'px-4 py-1.5 text-sm font-medium rounded-md bg-card text-foreground shadow-sm' : 'px-4 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground'}>
                {t === 'content' ? '诗词内容' : '知识'}
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button onClick={function() { setShowPy(!showPy) }}
            className={'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ' + (showPy ? 'bg-card text-foreground shadow-sm' : 'bg-card text-muted-foreground')}>
            <Languages className="h-3.5 w-3.5" />拼音
          </button>
          <button onClick={function() { speak(p.content.join('，')) }} className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium card-hover">
            <Volume2 className="h-3.5 w-3.5 text-primary" /> {p.grade > 0 ? '朗读全诗' : '朗读'}
          </button>
          {p.grade > 0 && (
            <button onClick={function() { setReciting(true) }} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-medium card-hover">
              <Play className="h-3.5 w-3.5" /> 开始背诵
            </button>
          )}
        </div>
      </div>

      {tab === 'content' ? (
        <div className="space-y-4">
            {reciting ? <div className="text-center text-lg lg:text-xl leading-8 lg:leading-10 font-poem tracking-wide text-muted-foreground/40">
              {p.content.map(function(line, i) {
                return <p key={i}>{line.replace(/[\u4e00-\u9fff]/g, '**')}</p>
              })}
            </div> : <div className="rounded-xl lg:rounded-2xl bg-gradient-to-b from-muted/50 to-muted/30 p-6 lg:p-10">
              {p.content.map(function(line, i) {
                return <p key={i} className="text-center text-lg lg:text-xl leading-8 lg:leading-10 font-poem tracking-wide"><PinyinText text={line} show={showPy} /></p>
              })}
            </div>}
          {p.author_info && AuthorInfo(poem)}
          {p.translation ? TextBlock(p.translation, '译文', 'emerald') : (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-500" /> 译文
                </h3>
                {aiLoading === 'translation' ? <span className="text-xs text-muted-foreground">生成中...</span> : !aiContent.translation && (
                  <button onClick={function() { generateContent('translation', '请直接将这首古诗翻译为现代汉语，不要任何前缀、标题或额外说明') }} className="text-xs flex items-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" /> AI生成
                  </button>
                )}
              </div>
              {aiContent.translation && <div className="text-sm text-muted-foreground whitespace-pre-wrap">{aiContent.translation}</div>}
            </div>
          )}
          {p.annotation ? CollapseBlock(p.annotation, '注释', 'amber') : (
            <details className="rounded-xl border bg-card">
              <summary className="text-sm font-medium p-4 lg:p-5 cursor-pointer flex items-center gap-1.5 text-muted-foreground" style={{ listStyle: 'none' }}>
                <span className="flex items-center gap-1.5 flex-1">
                  <BookOpen className="h-4 w-4 text-amber-500" /> 注释
                </span>
                {aiLoading === 'annotation' ? <span className="text-xs text-muted-foreground">生成中...</span> : !aiContent.annotation && (
                  <button onClick={function(e) { e.stopPropagation(); generateContent('annotation', '请直接列出这首古诗中生僻字词的注释，每条一行，不要任何前缀、标题或额外说明') }} className="text-xs flex items-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" /> AI生成
                  </button>
                )}
                <ChevronDown className="h-4 w-4 text-foreground/60 shrink-0" />
              </summary>
              {aiContent.annotation && <div className="px-4 lg:px-5 pb-4 lg:pb-5 text-sm whitespace-pre-wrap text-muted-foreground">{aiContent.annotation}</div>}
            </details>
          )}
          {p.appreciation ? CollapseBlock(p.appreciation, '赏析', 'sky') : (
            <details className="rounded-xl border bg-card">
              <summary className="text-sm font-medium p-4 lg:p-5 cursor-pointer flex items-center gap-1.5 text-muted-foreground" style={{ listStyle: 'none' }}>
                <span className="flex items-center gap-1.5 flex-1">
                  <BookOpen className="h-4 w-4 text-sky-500" /> 赏析
                </span>
                {aiLoading === 'appreciation' ? <span className="text-xs text-muted-foreground">生成中...</span> : !aiContent.appreciation && (
                  <button onClick={function(e) { e.stopPropagation(); generateContent('appreciation', '请对这首古诗进行赏析') }} className="text-xs flex items-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" /> AI生成
                  </button>
                )}
                <ChevronDown className="h-4 w-4 text-foreground/60 shrink-0" />
              </summary>
              {aiContent.appreciation && <div className="px-4 lg:px-5 pb-4 lg:pb-5 text-sm whitespace-pre-wrap text-muted-foreground">{aiContent.appreciation}</div>}
            </details>
          )}
          {p.background ? CollapseBlock(p.background, '创作背景', 'purple') : (
            <details className="rounded-xl border bg-card">
              <summary className="text-sm font-medium p-4 lg:p-5 cursor-pointer flex items-center gap-1.5 text-muted-foreground" style={{ listStyle: 'none' }}>
                <span className="flex items-center gap-1.5 flex-1">
                  <BookOpen className="h-4 w-4 text-purple-500" /> 创作背景
                </span>
                {aiLoading === 'background' ? <span className="text-xs text-muted-foreground">生成中...</span> : !aiContent.background && (
                  <button onClick={function(e) { e.stopPropagation(); generateContent('background', '请介绍这首古诗的创作背景') }} className="text-xs flex items-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" /> AI生成
                  </button>
                )}
                <ChevronDown className="h-4 w-4 text-foreground/60 shrink-0" />
              </summary>
              {aiContent.background && <div className="px-4 lg:px-5 pb-4 lg:pb-5 text-sm whitespace-pre-wrap text-muted-foreground">{aiContent.background}</div>}
            </details>
          )}
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {p.exam_points && p.exam_points.length > 0 && ExamPoints(p.exam_points)}
        </div>
      )}
      {reciting ? <ReciteDialog poem={poem} onResult={handleRecite} onClose={closeRecite} /> : null}
    </div>
  )
}

function AuthorInfo(poem: any) {
  var info = poem.author_info
  if (!info) return null
  return (
    <div className="rounded-xl border bg-card p-4 lg:p-5">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-muted-foreground">
        <User className="h-4 w-4 text-primary" /> 关于作者
      </h3>
      <p className="font-medium">{info.name}（{info.dynasty}）</p>
      {info.description && <div className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: info.description }} />}
      {info.representative_works && info.representative_works.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {info.representative_works.map(function(w: string, i: number) {
            return <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{w}</span>
          })}
        </div>
      )}
    </div>
  )
}

function TextBlock(content: string, label: string, _color: string) {
  return (
    <div className="rounded-xl border bg-card p-4 lg:p-5">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-muted-foreground">
        <BookOpen className="h-4 w-4 text-emerald-500" /> {label}
      </h3>
      <div className="text-sm whitespace-pre-wrap text-muted-foreground" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

function CollapseBlock(content: string, label: string, _color: string) {
  return (
    <details open className="rounded-xl border bg-card">
      <summary className="text-sm font-medium p-4 lg:p-5 cursor-pointer flex items-center gap-1.5 text-muted-foreground" style={{ listStyle: 'none' }}>
        <span className="flex items-center gap-1.5 flex-1">
          <BookOpen className="h-4 w-4" /> {label}
        </span>
        <ChevronDown className="h-4 w-4 text-foreground/60 shrink-0" />
      </summary>
      <div className="px-4 lg:px-5 pb-4 lg:pb-5 text-sm whitespace-pre-wrap text-muted-foreground" dangerouslySetInnerHTML={{ __html: content }} />
    </details>
  )
}

function ExamPoints(points: any[]) {
  if (!points || points.length === 0) return null
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 lg:p-5">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5 text-muted-foreground">
        <GraduationCap className="h-4 w-4 text-primary" /> 知识点（{points.length}）
      </h3>
      <div className="space-y-2">
        {points.map(function(ep: any, i: number) {
          return (
            <details key={i} open className="rounded-lg border bg-card p-3 lg:p-4 text-sm">
              <summary className="font-medium cursor-pointer flex items-center gap-2">
                <span className="flex-1 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{ep.name}</span>
                  <span className={'text-xs ' + (ep.difficulty === 'easy' ? 'text-emerald-500' : ep.difficulty === 'medium' ? 'text-amber-500' : 'text-red-500')}>
                    {ep.difficulty === 'easy' ? '简单' : ep.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-foreground/60 shrink-0" />
              </summary>
              <div className="mt-3 space-y-2">
                <div className="text-muted-foreground"><span className="text-primary">问：</span><span className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: ep.question }} /></div>
                <div><span className="text-emerald-600 dark:text-emerald-400">答：</span><span className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: ep.answer }} /></div>
                {ep.analysis && <div className="text-xs text-muted-foreground mt-1">💡 <span className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: ep.analysis }} /></div>}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
