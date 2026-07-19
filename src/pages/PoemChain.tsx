import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw, BookOpen, Edit3, Library } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'

var CATEGORIES = [
  { name: '自然气象', chars: '花月风云雨雪山水天江海烟雾露霜星霞雷溪湖川' },
  { name: '四季时节', chars: '春夏秋冬夜日朝暮晓夕晨旦暝曙腊寒暑阴晴' },
  { name: '色彩', chars: '红绿白黄青碧翠紫金银朱苍黛素玄丹粉彩皓' },
  { name: '花草植物', chars: '梅兰竹菊柳桃荷松莲桂杏枫杨槐桑芷榴' },
  { name: '飞鸟动物', chars: '鸟雁马燕鱼蝉鹤蝶莺猿犬鸡鸦龙凤鹊鸥鹭蚕' },
  { name: '情感心境', chars: '愁恨思爱醉梦泪孤悲欢忧怨乐惊叹伤喜闲静空' },
  { name: '方位数字', chars: '东南西北上下千万半点百前后左右中远近深高低' },
  { name: '动作行为', chars: '归行来去望看飞落闻问送饮眠登渡别歌舞吟笑坐' },
]

var elTa: HTMLTextAreaElement | null = null
function decodeHtml(s: string): string {
  if (typeof document === 'undefined') return s
  if (!elTa) { elTa = document.createElement('textarea') }
  elTa.innerHTML = s
  return elTa.value
}

interface PoemHit {
  title: string
  author: string
  dynasty: string
  lines: string[]
}

export default function PoemChain() {
  var poems = useStore(function(s) { return s.poems })
  var [mode, setMode] = useState<'practice' | 'quiz' | 'chars'>('practice')
  var [themeChar, setThemeChar] = useState('')
  var [themeCat, setThemeCat] = useState('')
  var [matched, setMatched] = useState<string[]>([])
  var [quizHits, setQuizHits] = useState<PoemHit[]>([])
  var [input, setInput] = useState('')
  var [hint, setHint] = useState('')
  var [score, setScore] = useState(0)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)
  var [manualQuiz, setManualQuiz] = useState(false)

  // 统计每个字出现在诗词中的次数
  var charCounts = useMemo(function() {
    var map: Record<string, number> = {}
    for (var p of poems) {
      if ((p.type || '').includes('文言文')) continue
      var content = p.content || []
      for (var line of content) {
        for (var ch of line) {
          if (/[\u4e00-\u9fa5]/.test(ch)) map[ch] = (map[ch] || 0) + 1
        }
      }
    }
    return map
  }, [poems])

  function findQuizHits(c: string) {
    var hits: PoemHit[] = []
    var seen = new Set<string>()
    for (var p of poems) {
      var content = p.content || []
      var matchingLines = content.filter(function(l) { return l.includes(c) })
      // 排除文言文：type 标记 + 内容启发式（长行或行数多的视为散文）
      var isWenyan = (p.type || '').includes('文言文')
      if (!isWenyan && content.length > 0) {
        var avgLen = content.reduce(function(s, l) { return s + l.length }, 0) / content.length
        isWenyan = avgLen > 30 || content.length > 20
      }
      if (matchingLines.length === 0 || isWenyan) continue
      // 取至少 2 句，如果匹配行不够就取相邻行
      var displayLines: string[] = []
      var matchedIdx = content.findIndex(function(l) { return l.includes(c) })
      if (matchedIdx >= 0) {
        displayLines.push(decodeHtml(content[matchedIdx]))
        if (matchedIdx + 1 < content.length) displayLines.push(decodeHtml(content[matchedIdx + 1]))
        else if (matchedIdx - 1 >= 0) displayLines.unshift(decodeHtml(content[matchedIdx - 1]))
      }
      // 限制总长度
      var totalLen = displayLines.reduce(function(s, l) { return s + l.length }, 0)
      if (totalLen > 200) {
        displayLines = [displayLines.join('').slice(0, 200) + '...']
      }
      var key = p.title + '-' + p.author
      if (seen.has(key)) continue
      seen.add(key)
      hits.push({ title: p.title, author: p.author, dynasty: p.dynasty, lines: displayLines })
    }
    hits.sort(function(a, b) { return a.author.localeCompare(b.author) })
    setQuizHits(hits)
  }

  function pickChar() {
    var cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    var c = cat.chars[Math.floor(Math.random() * cat.chars.length)]
    setThemeChar(c)
    setThemeCat(cat.name)
    if (mode === 'quiz') {
      findQuizHits(c)
    }
  }

  function initGame(skipPick?: boolean) {
    if (mode === 'practice' && score > 0) {
      db.gameRecords.add({ game: '飞花令', poemTitle: themeChar, poemAuthor: themeCat, elapsed: elapsed, success: true, createdAt: new Date() })
    }
    setMatched([])
    setInput('')
    setHint('')
    setScore(0)
    setQuizHits([])
    setStartTime(Date.now())
    setElapsed(0)
    if (!skipPick) pickChar()
  }

  useEffect(function() { if (poems.length > 0) { if (manualQuiz) setManualQuiz(false); else initGame() } }, [poems.length, mode])
  useEffect(function() {
    if (startTime === 0 || mode !== 'practice') return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [startTime, mode])

  function submitLine() {
    var line = input.trim()
    if (!line || !themeChar) return
    if (matched.includes(line)) { setHint('这句已经说过了！'); return }

    var inLibrary = false
    for (var i = 0; i < poems.length; i++) {
      for (var j = 0; j < poems[i].content.length; j++) {
        if (poems[i].content[j] === line) { inLibrary = true; break }
      }
      if (inLibrary) break
    }

    if (!line.includes(themeChar)) { setHint('这句诗不包含「' + themeChar + '」字'); return }
    if (!inLibrary) { setHint('诗库未收录，请自行判断是否正确') }

    setMatched(function(prev) { return [line, ...prev] })
    setScore(function(p) { return p + 1 })
    setInput('')
    setTimeout(function() { setHint('') }, inLibrary ? 0 : 2000)
  }

  function pickCharAndQuiz(c: string) {
    var cat = CATEGORIES.find(function(cat) { return cat.chars.includes(c) })
    setThemeChar(c)
    setThemeCat(cat?.name || '')
    setQuizHits([])
    setManualQuiz(true)
    setMode('quiz')
    findQuizHits(c)
  }

  function switchMode(m: 'practice' | 'quiz' | 'chars') {
    setMode(m)
    if (m === 'quiz' && !themeChar) { pickChar(); findQuizHits(themeChar) }
  }

  return (
    <div className="page-enter h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <button onClick={function() { window.history.back() }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">飞花令</span>
        <div className="flex-1" />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit mb-4 mx-auto">
        <button onClick={function() { switchMode('chars') }}
          className={'px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ' + (mode === 'chars' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          <Library className="h-3.5 w-3.5" /> 字库
        </button>
        <button onClick={function() { switchMode('quiz') }}
          className={'px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ' + (mode === 'quiz' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          <BookOpen className="h-3.5 w-3.5" /> 刷题模式
        </button>
        <button onClick={function() { switchMode('practice') }}
          className={'px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 ' + (mode === 'practice' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          <Edit3 className="h-3.5 w-3.5" /> 练习模式
        </button>
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full flex-1 overflow-y-auto pb-4 lg:pb-0">
        {/* Theme */}
        <div className="text-center mb-4">
          <h2 className="text-sm text-muted-foreground mb-1">{mode === 'practice' ? '说出包含以下字的诗句' : mode === 'quiz' ? '包含「' + themeChar + '」的诗句' : ''}</h2>
          {themeChar && mode !== 'chars' && (
            <div>
              <span className="text-xs text-muted-foreground/60">分类：{themeCat}</span>
              <div className="text-5xl font-bold text-primary font-poem my-3" style={{ textShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                {themeChar}
              </div>
              {mode === 'practice' && <p className="text-xs text-muted-foreground">已答：<span className="text-primary font-semibold">{score}</span> 句 {startTime > 0 && <span>· ⏱ {elapsed}秒</span>}</p>}
            </div>
          )}
        </div>

        {/* Practice mode input */}
        {mode === 'practice' && <div className="flex gap-2 mb-4">
          <input value={input} onChange={function(e) { setInput(e.target.value) }}
            onKeyDown={function(e) { if (e.key === 'Enter') submitLine() }}
            placeholder="输入包含该字的诗句..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <button onClick={submitLine} disabled={!input.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors">
            提交
          </button>
        </div>}

        {mode === 'practice' && hint && <div className={'text-xs text-center mb-3 ' + (hint.includes('已经') || hint.includes('未收录') ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400')}>{hint}</div>}

        {/* Practice matched list */}
        {mode === 'practice' && <div className="rounded-xl border bg-card p-4 min-h-[120px]">
          {matched.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">还没有诗句被说出...</p>}
          <div className="space-y-1.5">
            {matched.map(function(line, i) {
              var parts = line.split(themeChar)
              return (
                <div key={i} className="text-sm leading-7 font-poem tracking-wide">
                  {parts.map(function(p, pi) {
                    return <span key={pi}>{p}{pi < parts.length - 1 ? <span className="text-primary font-bold text-base">{themeChar}</span> : ''}</span>
                  })}
                </div>
              )
            })}
          </div>
        </div>}

        {/* Quiz mode results */}
        {mode === 'quiz' && <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-xs text-muted-foreground">{quizHits.length} 首相关诗词</span>
            <div className="flex items-center gap-1.5">
              <button onClick={function() { initGame() }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium hover:bg-muted/70 transition-colors">
                <RotateCcw className="h-3 w-3" /> 换一个字
              </button>
              <button onClick={function() { setShowRecords(true) }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/50 text-xs font-medium hover:bg-muted/70 transition-colors">
                🏆 记录
              </button>
            </div>
          </div>
          <div className="max-h-[65vh] overflow-y-auto px-4 pb-3">
            {quizHits.length === 0 && themeChar ? <p className="text-xs text-muted-foreground text-center py-4">没有找到包含「{themeChar}」的诗词</p> : null}
            <div className="space-y-2">
              {quizHits.map(function(hit, i) {
                return (
                  <div key={i} className="border-b border-border last:border-b-0 pb-2 last:pb-0">
                    <p className="text-sm font-poem leading-relaxed">
                      {hit.lines.map(function(line, li) {
                        var parts = line.split(themeChar)
                        return <span key={li}>{parts.map(function(p, pi) {
                          return <span key={pi}>{p}{pi < parts.length - 1 ? <span className="text-primary font-bold">{themeChar}</span> : ''}</span>
                        })}</span>
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">《{hit.title}》· {hit.dynasty} · {hit.author}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>}

        {/* Chars mode - 字库 */}
        {mode === 'chars' && <div className="rounded-xl border bg-card p-4 max-h-[65vh] overflow-y-auto">
          {CATEGORIES.map(function(cat) {
            return <div key={cat.name} className="mb-4 last:mb-0">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">{cat.name}</h3>
              <div className="flex flex-wrap gap-1.5">
                {cat.chars.split('').map(function(ch) {
                  var count = charCounts[ch] || 0
                  var color = count > 100 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                              count > 50 ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                              'text-muted-foreground border-border'
                  return <span key={ch} onClick={function() { pickCharAndQuiz(ch) }} className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium cursor-pointer ' + color}
                    title={'包含「' + ch + '」的诗词：' + count + '首'}>
                    {ch}<span className="text-[10px] opacity-60">{count}</span>
                  </span>
                })}
              </div>
            </div>
          })}
        </div>}

        {/* Action buttons - practice mode only */}
        {mode === 'practice' && (<div className="flex gap-2 justify-center mt-4">
          <button onClick={function() { initGame() }} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> {mode === 'practice' ? '再来一次' : '换一个字'}
          </button>
          {mode === 'practice' && <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一个字
          </button>}
        </div>)}
        {mode !== 'quiz' && <div className="flex justify-center mt-3">
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors">
            🏆 记录
          </button>
        </div>}

        {themeChar && mode !== 'chars' && mode === 'practice' && <p className="text-center text-xs text-muted-foreground mt-4">💡 输入的完整诗句必须有某个字包含「{themeChar}」</p>}
      </div>
      <RecordsModal game="飞花令" open={showRecords} onClose={function() { setShowRecords(false) }} />
    </div>
  )
}
