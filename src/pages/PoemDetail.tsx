import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore } from '../store'
import { useSelectionStore } from '../store/selection'
import { useUserStore } from '../store/user'
import { db } from '../lib/db'
import { ArrowLeft, Volume2, Heart, BookOpen, User, GraduationCap, Play, ChevronDown, Star, Languages } from 'lucide-react'
import { PinyinText } from '../components/PinyinText'

const GRADE_FULL = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']

export default function PoemDetail() {
  var { title } = useParams()
  var poems = useStore(function(s) { return s.poems })
  var poem = poems.find(function(p) { return p.title === decodeURIComponent(title || '') })

  var [tab, setTab] = useState('content')
  var [isFav, setIsFav] = useState(false)
  var [showPy, setShowPy] = useState(false)
  var userId = useUserStore(function(s) { return s.currentUser?.id })

  useEffect(function() {
    if (!poem || !userId) return
    db.favorites.where('userId').equals(userId).and(function(f) { return f.poemTitle === poem.title }).first().then(function(f) { setIsFav(!!f) })
    useSelectionStore.getState().setPoemContext({
      title: poem.title, author: poem.author, content: poem.content.join(''),
    })
    return function() { useSelectionStore.getState().setPoemContext(null) }
  }, [poem])

  var toggleFav = async function() {
    if (!poem || !userId) return
    if (isFav) {
      var f = await db.favorites.where('userId').equals(userId).and(function(f) { return f.poemTitle === poem.title }).first()
      if (f && f.id) await db.favorites.delete(f.id)
      setIsFav(false)
    } else {
      await db.favorites.add({ userId: userId, poemTitle: poem.title, createdAt: new Date() })
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

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/poems" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
        <div className="flex-1" />
        <button onClick={toggleFav} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Heart className={isFav ? 'fill-red-500 text-red-500 h-4 w-4' : 'h-4 w-4'} />
          {isFav ? '已收藏' : '收藏'}
        </button>
      </div>

      <div className="text-center py-6 lg:py-8 border-b mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold font-poem tracking-wide">{poem.title}</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-2">{poem.dynasty} · {poem.author}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{poem.type}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">{GRADE_FULL[poem.grade]}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">难度 {poem.difficulty}</span>
          {poem.examFrequency > 0 && <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
            {Array.from({ length: Math.min(poem.examFrequency, 5) }).map(function(_, i) { return <Star key={i} className="h-3 w-3 fill-current" /> })}
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
        <button onClick={function() { setShowPy(!showPy) }}
          className={'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ' + (showPy ? 'bg-card text-foreground shadow-sm border' : 'text-muted-foreground hover:text-foreground border border-transparent')}>
          <Languages className="h-3.5 w-3.5 inline mr-0.5" />拼音
        </button>
      </div>

      {tab === 'content' ? (
        <div className="space-y-4">
          <div className="rounded-xl lg:rounded-2xl bg-gradient-to-b from-muted/50 to-muted/30 p-6 lg:p-10">
            {poem.content.map(function(line, i) {
              return <p key={i} className="text-center text-lg lg:text-xl leading-8 lg:leading-10 font-poem tracking-wide"><PinyinText text={line} show={showPy} /></p>
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <button onClick={function() { speak(poem.content.join('，')) }} className="flex items-center justify-center gap-2 rounded-xl border bg-card py-3 lg:py-3.5 text-sm font-medium card-hover">
              <Volume2 className="h-4 w-4 text-primary" /> 朗读全诗
            </button>
            <Link to={'/review?poem=' + encodeURIComponent(poem.title)} className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 lg:py-3.5 text-sm font-medium card-hover">
              <Play className="h-4 w-4" /> 开始背诵
            </Link>
          </div>
          {poem.author_info && AuthorInfo(poem)}
          {poem.translation && TextBlock(poem.translation, '译文', 'emerald')}
          {poem.annotation && CollapseBlock(poem.annotation, '注释', 'amber')}
          {poem.appreciation && CollapseBlock(poem.appreciation, '赏析', 'sky')}
          {poem.background && CollapseBlock(poem.background, '创作背景', 'purple')}
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {poem.exam_points && poem.exam_points.length > 0 && ExamPoints(poem.exam_points)}
        </div>
      )}
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
