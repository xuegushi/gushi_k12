import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Gamepad2, Lightbulb, Sparkles, RotateCcw, X, ArrowLeft, Share2, Link as LinkIcon, ImageDown, Check } from 'lucide-react'
import Celebration from '../components/Celebration'
import RecordsModal from '../components/RecordsModal'
import poetTimelines from '../data/poetTimelines'

interface TimelineEntry {
  y: number; a: number;
  loc: { h: string; m: string; pv: string; t: string } | null;
  ev: string; d: string;
}
interface TimelinePhase { n: string; es: TimelineEntry[] }
interface PoetTL {
  n: string;
  p: TimelinePhase[];
  s: { provinces: number; counties: number; settlements: string[]; route: string; poems: number; years: number } | null;
}

var TL_DATA = poetTimelines as unknown as PoetTL[]

function isCn(s: string) { return !/[a-zA-Z]/.test(s) }
var EN_EVENTS: Record<string, string> = {
  birth: '出生', death: '逝世', education: '求学', study: '求学', start: '起始',
  jinshi: '中进士', zhuangyuan: '中状元', exams: '应试', exams_start: '赴考',
  official: '入仕', career: '仕途', service: '任职', prefect: '任知州',
  advisor: '任谏官', editor: '任编修', chancellor: '拜相', envoy: '出使',
  resign: '辞官', retire: '致仕', reappointed: '复起',
  exile: '流放', exiled: '流放', captured: '被俘', return: '归乡',
  rebellion: '平叛', defense: '守城', revolution: '起义',
  travel: '游历', abroad: '出塞', peak: '登顶',
  masterpiece: '代表作', creative: '创作', contribution: '贡献',
  reclusion: '归隐', recommend: '举荐', refused: '辞不就',
  wuxu: '戊戌变法', jingkang: '靖康之变', tang: '唐代',
  song: '宋代', beijing: '北京', southern: '南渡',
  dasheng: '大晟府', gongche: '宫车', jinglue: '经略',
  recommend: '举荐', prince: '亲王',
  peak: '巅峰',
}
function cleanEv(s: string) {
  var lower = s.toLowerCase()
  if (EN_EVENTS[lower]) return EN_EVENTS[lower]
  // Try splitting underscore-concatenated words
  var parts = lower.split('_').map(function(p) { return EN_EVENTS[p] || p })
  return parts.join('')
}
function getInfo(tl: PoetTL) {
  var allEntries = tl.p ? tl.p.flatMap(function(ph) { return ph.es || [] }) : []
  var birth = allEntries.find(function(e) { return isCn(e.ev) && (e.loc?.t === 'birthplace' || e.ev === '出生') })
  var death = allEntries.find(function(e) { return isCn(e.ev) && (e.loc?.t === 'death' || e.ev === '病逝' || e.ev === '逝世') })
  var parts: string[] = []
  if (birth && death) parts.push(birth.y + '年-' + death.y + '年')
  else if (birth) parts.push(birth.y + '年生')
  if (tl.s?.years) parts.push('享年' + tl.s.years + '岁')
  if (birth?.loc) parts.push('出生于' + birth.loc.h + (birth.loc.m ? '（今' + birth.loc.m + '）' : ''))
  return parts.join('，') || '诗人足迹遍天下'
}

function pick<T>(arr: T[], n: number): T[] {
  var shuffled = [...arr].sort(function() { return Math.random() - 0.5 })
  return shuffled.slice(0, n)
}

export default function PoemGuessWho() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  // 仅展示当前诗词库中有的诗人
  var poetSet = useMemo(function() { return new Set(poems.map(function(p) { return p.author })) }, [poems])
  var filteredTL = useMemo(function() { return TL_DATA.filter(function(t) { return poetSet.has(t.n) }) }, [poetSet])
  var [queue, setQueue] = useState<PoetTL[]>([])
  var [current, setCurrent] = useState<PoetTL | null>(null)
  var [options, setOptions] = useState<string[]>([])
  var [round, setRound] = useState(0)
  var [score, setScore] = useState(0)
  var [hintLevel, setHintLevel] = useState(0)
  var [feedback, setFeedback] = useState<'correct' | 'wrong' | ''>('')
  var [selectedOpt, setSelectedOpt] = useState('')
  var [showConfetti, setShowConfetti] = useState(false)
  var [showRecords, setShowRecords] = useState(false)
  var [gameOver, setGameOver] = useState(false)
  var [totalScore, setTotalScore] = useState(0)
  var [totalCorrect, setTotalCorrect] = useState(0)
  var [totalAttempts, setTotalAttempts] = useState(0)
  var [showHintModal, setShowHintModal] = useState(false)
  var [showFullModal, setShowFullModal] = useState(false)
  var [showShare, setShowShare] = useState(false)
  var [shareBg, setShareBg] = useState('#ffffff')
  var [copyOk, setCopyOk] = useState(false)
  var shareRef = useRef<HTMLDivElement>(null)

  // Map poet name → dynasty from poems data
  var poetDynasty = useMemo(function() {
    var map: Record<string, string> = {}
    for (var p of poems) { if (p.author && !map[p.author]) map[p.author] = p.dynasty || '' }
    return map
  }, [poems])

  // Map poet name → works with title + 2 lines (兼容 TL 中的带括号名)
  function normName(n: string) { return n.replace(/[（(].+[）)]/, '').trim() }
  var poetWorks = useMemo(function() {
    var map: Record<string, Array<{ title: string; lines: string[] }>> = {}
    for (var p of poems) {
      var key = normName(p.author)
      if (!map[key]) map[key] = []
      var lines = (p.content || []).filter(function(l: string) {
        var c = l.replace(/[，。！？、；：""''《》（）\s]/g, '')
        return c.length >= 4 && c.length <= 22
      })
      if (lines.length >= 2) map[key].push({ title: p.title, lines: lines.slice(0, 2) })
    }
    return map
  }, [poems])

  var currentHintLines = useMemo(function() {
    if (!current) return []
    var works = poetWorks[normName(current.n)] || []
    if (works.length > 0) {
      return works.slice(0, 3).map(function(w) { return '《' + w.title + '》：' + w.lines.join('') })
    }
    var skip = ['出生', 'birth', '逝世', 'death']
    var events = current.p ? current.p.flatMap(function(ph) { return ph.es || [] }) : []
    var good = events.filter(function(e) { return skip.indexOf(cleanEv(e.ev)) === -1 && e.d && e.d.length > 10 })
    return good.slice(0, 3).map(function(e) { return hideName(cleanEv(e.ev)) + '：' + hideName(e.d).replace(/[。！？；]/g, '。').split('。')[0] + '。' })
  }, [current, poetWorks])

  // 游历数据 — 只在切换题目时重新计算
  var travelPicks = useMemo(function() {
    if (!current) return []
    var ae = current.p.flatMap(function(ph) { return ph.es || [] })
    var te = ae.filter(function(e) { return e.loc?.t === 'travel' })
    var third = Math.ceil(ae.length / 4)
    var periods = [[0, third], [third, third * 2], [third * 2, third * 3], [third * 3, ae.length]]
    var picks = periods.map(function(r) {
      var pool = te.filter(function(e) { var idx = ae.indexOf(e); return idx >= r[0] && idx < r[1] })
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
    }).filter(Boolean) as any[]
    if (picks.length < 4) {
      var others = ae.filter(function(e: any) { return picks.indexOf(e) === -1 })
      for (var e of others) { if (picks.length >= 4) break; picks.push(e) }
    }
    picks.sort(function(a: any, b: any) { return a.y - b.y })
    return picks
  }, [current])

  function genOptions(correct: string) {
    var dynasty = poetDynasty[normName(correct)]
    var sameDynasty = filteredTL.filter(function(t) {
      return t.n !== correct && poetDynasty[t.n] === dynasty
    })
    var distractionPool = sameDynasty.length >= 3 ? sameDynasty : TL_DATA.filter(function(t) { return t.n !== correct })
    var distractors = pick(distractionPool, 3).map(function(t) { return t.n })
    var all = [correct, ...distractors]
    return pick(all, 4) // shuffle into random order
  }

  function startGame() {
    var q = pick(filteredTL, 5)
    setQueue(q)
    var first = q[0]
    setCurrent(first || null)
    if (first) setOptions(genOptions(first.n))
    setRound(0)
    setScore(0)
    setHintLevel(0)
    setSelectedOpt('')
    setFeedback('')
    setGameOver(false)
    setTotalScore(0)
    setTotalCorrect(0)
    setTotalAttempts(0)
  }

  useEffect(function() { if (filteredTL.length > 0) startGame() }, [filteredTL])

  function hideName(text: string) {
    if (!current) return text
    return text.replace(new RegExp(current.n, 'g'), '诗人')
  }

  function nextHint() {
    if (!current) return
    setHintLevel(function(h) { return Math.min(h + 1, 3) })
  }

  function handlePick(name: string) {
    if (!current || feedback !== '') return
    setSelectedOpt(name)
    setTotalAttempts(function(n) { return n + 1 })
    if (name === current.n) {
      var points = Math.max(20 - hintLevel * 5, 5)
      setTotalCorrect(function(n) { return n + 1 })
      setScore(function(s) { return s + points })
      setTotalScore(function(s) { return s + points })
      setFeedback('correct')
      setShowConfetti(true)
      setTimeout(function() { setShowConfetti(false) }, 1500)
    } else {
      setFeedback('wrong')
      setTimeout(function() { setFeedback('') }, 1000)
    }
  }

  function nextQuestion() {
    var nextRound = round + 1
    if (nextRound >= 5) { setGameOver(true); setShowRecords(true); return }
    setRound(nextRound)
    var next = queue[nextRound]
    setCurrent(next)
    if (next) setOptions(genOptions(next.n))
    setHintLevel(0)
    setSelectedOpt('')
    setFeedback('')
  }

  if (filteredTL.length === 0) return <div className="py-16 text-center text-sm text-muted-foreground">暂无数据</div>

  return (
    <div className="page-enter max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={function() { navigate('/games') }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"><ArrowLeft className="h-4 w-4" /></button>
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold flex-1">猜猜他是谁</h1>
        <button onClick={function() { setShowShare(true) }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"><Share2 className="h-4 w-4" /></button>
      </div>

      {gameOver ? <div className="text-center py-8 space-y-4">
        <Sparkles className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold">游戏结束!</h2>
        <p className="text-3xl font-bold text-primary">{totalScore} 分</p>
        <div className="flex justify-center gap-2">
          <button onClick={startGame} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer">
            <RotateCcw className="h-4 w-4" /> 再来一局
          </button>
        </div>
        <RecordsModal game="猜诗人" open={showRecords} onClose={function() { setShowRecords(false) }} />
      </div> : current ? <div className="space-y-4">
        {/* 进度与分数 */}
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground w-20">第 {round + 1}/5 题</span>
          <span className="flex-1 text-center text-sm font-bold text-primary">{score} 分</span>
          <span className="text-xs text-muted-foreground w-20 text-right">正确率 {totalAttempts > 0 ? Math.round(totalCorrect / totalAttempts * 100) : 0}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: ((round + 1) / 5) * 100 + '%' }} />
        </div>

        {/* 诗人信息展示 */}
        {feedback === 'correct' ? <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">✓ {current.n}</div>
            <div className="text-xs text-muted-foreground mt-1">{hideName(getInfo(current))}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">代表作品</span>
            {function() {
              var works = poetWorks[normName(current.n)] || []
              // 兜底：直接从 poems 取
              if (works.length === 0) {
                for (var p of poems) {
                  if (p.author === normName(current.n) && (p.content || []).length >= 2) {
                    works.push({ title: p.title, lines: (p.content || []).slice(0, 2) })
                  }
                }
              }
              return works.length > 0 ? <div className="space-y-1 mt-1">
                {works.slice(0, 3).map(function(w, i) {
                  return <div key={i} className="text-sm font-poem"><span className="font-medium">《{w.title}》</span> {w.lines.join('')}</div>
                })}
              </div> : <div className="text-xs text-muted-foreground mt-1">暂无</div>
            }()}
          </div>
        </div> : <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0">人生足迹</span>
              <span className="text-sm">{hideName(getInfo(current))}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">游历记录</span>
              <div className="mt-1 space-y-2">
                {travelPicks.map(function(e: any, i: number) {
                  var ev = hideName(cleanEv(e.ev))
                  var loc = e.loc?.h || ''
                  if (loc && ev.indexOf(loc) !== -1) loc = ''
                  var prov = e.loc?.pv || ''
                  var detail = e.d ? hideName(e.d) : ''
                  return <div key={i} className="border-l-2 border-muted pl-3 py-1">
                    <div className="text-sm"><span className="font-medium">{ev}</span><span className="text-xs text-muted-foreground ml-2">{e.y}年{loc ? ' · ' + (prov ? prov + ' ' : '') + loc : ''}{prov && !loc ? ' · ' + prov : ''}</span></div>
                    {detail ? <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail}</div> : null}
                  </div>
                })}
              </div>
            </div>
            {current.s?.route ? <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0">漫游路线</span>
              <span className="text-sm font-poem">{current.s.route}</span>
            </div> : null}
          </div>
        </div>}

        {/* 选项 — 答对后隐藏 */}
        {feedback !== 'correct' ? <div className="grid grid-cols-2 gap-2">
          {options.map(function(name) {
            var isSelected = selectedOpt === name
            var isCorrect = feedback === 'correct' && name === current.n
            var isWrong = feedback === 'wrong' && isSelected
            var disabled = feedback !== ''
            return (
              <button key={name} onClick={function() { handlePick(name) }} disabled={disabled}
                className={'rounded-xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer ' + (
                  isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-600 dark:text-emerald-400' :
                  isWrong ? 'bg-red-50 border-red-400 text-red-600 dark:bg-red-950/20 dark:border-red-600 dark:text-red-400' :
                  'bg-card border-border hover:border-primary/50 hover:bg-muted/50 text-foreground'
                ) + (disabled ? ' opacity-60' : '')}>
                {name}
              </button>
            )
          })}
        </div> : null}

        {/* 看提示 — 答对后隐藏 */}
        {feedback !== 'correct' ? <div className="flex justify-end">
          <button onClick={function() { setShowHintModal(true) }} disabled={hintLevel >= 3}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-30 cursor-pointer">
            <Lightbulb className="h-3.5 w-3.5" /> 看提示（-5分）
          </button>
        </div> : null}

        {/* 反馈 */}
        {feedback === 'correct' && <div className="text-right">
          <div className="text-emerald-600 font-medium text-sm mb-2">✓ 正确! +{Math.max(20 - hintLevel * 5, 5)} 分</div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={function() { setShowFullModal(true) }}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-muted-foreground/30 text-muted-foreground text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
              查看全文
            </button>
            <button onClick={nextQuestion}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer">
              下一题
            </button>
          </div>
        </div>}
        {feedback === 'wrong' && <div className="text-center text-red-500 font-medium text-sm">✗ 不对，再想想</div>}

        <Celebration show={showConfetti} />

        {/* 提示弹窗 */}
        {showHintModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={function() { setShowHintModal(false) }}>
          <div className="bg-background rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">提示</h3>
              <button onClick={function() { setShowHintModal(false) }} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
              <p className={'text-base leading-relaxed ' + (currentHintLines[hintLevel]?.length > 10 ? 'font-poem' : '')}>
                {currentHintLines[hintLevel] || '暂无提示'}
              </p>
            </div>
            <button onClick={function() { nextHint(); setShowHintModal(false) }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer">
              确定（-5分）
            </button>
          </div>
        </div> : null}

        {/* 全文弹窗 */}
        {showFullModal && current ? function() {
          var allEntries = current.p.flatMap(function(ph) { return ph.es || [] })
          var works = poetWorks[normName(current.n)] || []
          return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={function() { setShowFullModal(false) }}>
            <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[85vh]" onClick={function(e) { e.stopPropagation() }}>
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <h3 className="font-bold text-base">{current.n}的一生</h3>
                <button onClick={function() { setShowFullModal(false) }} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto">
                {/* 游历数据 */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">人生足迹</h4>
                  <div className="space-y-1">
                    {allEntries.map(function(e, i) {
                      return <div key={i} className="text-sm border-l-2 border-muted pl-3 py-1">
                        <span className="text-xs text-muted-foreground">{e.y}年</span>
                        <span className="text-xs text-muted-foreground ml-1">{e.a}岁</span>
                        <p className="text-sm mt-0.5">{function() { var ev = hideName(cleanEv(e.ev)); var l = e.loc?.h || ''; if (l && ev.indexOf(l) !== -1) l = ''; return ev + (l ? '（' + l + '）' : '') }()}</p>
                        {e.d ? <p className="text-xs text-muted-foreground mt-0.5">{hideName(e.d).replace(/[。！？；]/g, '。').split('。')[0]}。</p> : null}
                      </div>
                    })}
                  </div>
                </div>
                {/* 代表作品 */}
                {works.length > 0 ? <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">代表作品</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {works.map(function(w, i) {
                      return <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-foreground">《{w.title}》</span>
                    })}
                  </div>
                </div> : null}
              </div>
            </div>
          </div>
        }() : null}

        {/* 分享弹窗 */}
        {showShare ? function() {
          var BG_PRESETS = [
            { key: '素白', bg: '#ffffff' },
            { key: '宣纸', bg: '#f5f0e8' },
            { key: '青瓷', bg: '#e8f5e9' },
            { key: '绯红', bg: '#fce4ec' },
            { key: '晴空', bg: '#e3f2fd' },
            { key: '墨韵', bg: '#1a1a2e' },
          ]
          function isLight(hex: string) {
            var c = hex.replace('#', '')
            var r = parseInt(c.slice(0,2), 16), g = parseInt(c.slice(2,4), 16), b = parseInt(c.slice(4,6), 16)
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
          }
          var light = isLight(shareBg)
          var c = current
          var travelPicks: any[] = []
          if (c) {
            var ae = c.p.flatMap(function(ph) { return ph.es || [] })
            var te = ae.filter(function(e) { return e.loc?.t === 'travel' })
            var third = Math.ceil(ae.length / 3)
            var pp = [[0, third], [third, third * 2], [third * 2, ae.length]]
            travelPicks = pp.map(function(r) {
              var pool = te.filter(function(e) { var idx = ae.indexOf(e); return idx >= r[0] && idx < r[1] })
              return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
            }).filter(Boolean) as any[]
            if (travelPicks.length < 3) {
              var others = ae.filter(function(e: any) { return travelPicks.indexOf(e) === -1 })
              for (var e of others) { if (travelPicks.length >= 3) break; travelPicks.push(e) }
            }
            travelPicks.sort(function(a: any, b: any) { return a.y - b.y })
          }
          return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={function() { setShowShare(false) }}>
            <div className="bg-background rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4" onClick={function(e) { e.stopPropagation() }}>
              {/* 分享卡片 */}
              <div ref={shareRef} style={{ width: 320, minHeight: 427, backgroundColor: shareBg, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: light ? '#111827' : '#f3f4f6', fontFamily: 'sans-serif' }}>猜猜他是谁</div>
                <div style={{ textAlign: 'center', fontSize: 11, color: light ? '#6b7280' : '#d1d5db', fontFamily: 'sans-serif', marginBottom: 4 }}>根据以下线索猜出诗人名字</div>
                {c ? <div style={{ fontSize: 12, color: light ? '#374151' : '#e5e7eb', fontFamily: 'sans-serif', lineHeight: 1.6, width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>📅 <span style={{ color: light ? '#6b7280' : '#9ca3af' }}>人生足迹</span><br/>{hideName(getInfo(c))}</div>
                  <div style={{ marginBottom: 8 }}>🗺️ <span style={{ color: light ? '#6b7280' : '#9ca3af' }}>游历记录</span>
                    {travelPicks.map(function(e: any, i: number) {
                      var ev = hideName(cleanEv(e.ev))
                      var l = e.loc?.h || ''
                      if (l && ev.indexOf(l) !== -1) l = ''
                      var pv = e.loc?.pv || ''
                      var dt = e.d ? hideName(e.d) : ''
                      return <div key={i} style={{ marginTop: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: 12 }}>{ev}</span>
                        <span style={{ color: light ? '#6b7280' : '#9ca3af', fontSize: 10, marginLeft: 4 }}>{e.y}年{pv ? ' · ' + pv : ''}{l ? ' ' + l : ''}</span>
                        {dt ? <div style={{ color: light ? '#6b7280' : '#9ca3af', fontSize: 11, marginTop: 1 }}>{dt}</div> : null}
                      </div>
                    })}
                  </div>
                  {c.s?.route ? <div>🛤️ <span style={{ color: light ? '#6b7280' : '#9ca3af' }}>漫游路线</span><br/>{c.s.route}</div> : null}
                </div> : <div style={{ textAlign: 'center', fontSize: 12, color: light ? '#9ca3af' : '#6b7280' }}>暂无题目</div>}
                <div style={{ textAlign: 'center', fontSize: 10, color: light ? '#9ca3af' : '#6b7280', fontFamily: 'sans-serif', marginTop: 4 }}>学古诗 · xuegushi.com</div>
              </div>

              {/* 颜色选择 */}
              <div className="flex items-center justify-center gap-2">
                {BG_PRESETS.map(function(p) {
                  return <button key={p.key} onClick={function() { setShareBg(p.bg) }}
                    style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: p.bg, border: shareBg === p.bg ? '2px solid var(--color-primary)' : '2px solid #e5e7eb', cursor: 'pointer' }}
                    title={p.key} />
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={async function() {
                  try {
                    var domtoimage = (await import('dom-to-image-more')).default
                    var dataUrl = await domtoimage.toPng(shareRef.current!, { bgcolor: shareBg, scale: 3 })
                    var link = document.createElement('a')
                    link.download = '猜猜他是谁-' + (current?.n || '未知') + '.png'
                    link.href = dataUrl
                    link.click()
                  } catch (e) { console.error(e) }
                }} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium cursor-pointer">
                  <ImageDown className="h-3.5 w-3.5" /> 保存图片
                </button>
                <button onClick={async function() {
                  try {
                    await navigator.clipboard.writeText(window.location.href)
                    setCopyOk(true)
                    setTimeout(function() { setCopyOk(false) }, 2000)
                  } catch (e) { console.error(e) }
                }} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-muted-foreground/30 text-muted-foreground text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
                  {copyOk ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />}
                  {copyOk ? '已复制' : '复制链接'}
                </button>
              </div>
              <button onClick={function() { setShowShare(false) }} className="w-full py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium cursor-pointer">关闭</button>
            </div>
          </div>
        }() : null}
      </div> : null}
    </div>
  )
}
