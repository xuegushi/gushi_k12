import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../lib/db'
import { playTone } from '../lib/audio'
import { ArrowLeft, Undo2, RefreshCw, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RecordsModal from '../components/RecordsModal'
import Celebration from '../components/Celebration'
import MuteButton from '../components/MuteButton'

var OPTION_POOL = '天地人日月星辰风云雨雪山河水火木金花鸟虫鱼春夏秋冬东西南北中大长高远近来去古往今声色光影梦魂心意情愁恨爱思知见闻说读写歌吟叹喜怒哀乐悲欢离合生死安危冷暖清浊深浅明暗阳阴晴圆缺晨暮昼夜朝夕朝暮夕照光辉芒炎凉温热冷寒枯荣兴衰成败得失望归去来兮止行立卧坐起走奔跃飞浮沉潜飘落洒满盈空虚无实真假善恶美丑智愚巧拙雅俗贵贱贫富尊卑主仆臣君官民贼寇盗匪兵将帅士卒'

var similarCache: Record<string, { lookalikes: string[]; homophones: string[] }> | null = null

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }

async function getLookalikeDistractors(answerChars: string[], count: number): Promise<string[]> {
  if (!similarCache) {
    similarCache = {}
    var cnchar = (await import('cnchar')).default
    await import('cnchar-trad')
    var mod: any = await import('@leonsilicon/kris2808__similar-chinese-characters')
    var rows: any[][] = mod.default.rows

    for (var r of rows) {
      var tradChar = r[0]
      var laList = r[3] ? r[3].split(';') : []
      var hpList = r[4] ? r[4].split(';') : []
      similarCache[tradChar] = { lookalikes: laList, homophones: hpList }
      // Also map simplified version if different
      try {
        var simpleChar = cnchar.convert.tradToSimple(tradChar)
        if (simpleChar && simpleChar !== tradChar) {
          if (!similarCache[simpleChar]) similarCache[simpleChar] = { lookalikes: [], homophones: [] }
          similarCache[simpleChar].lookalikes.push(...laList)
          similarCache[simpleChar].homophones.push(...hpList)
        }
      } catch (e) { /* skip */ }
    }
  }

  var result: string[] = []
  var cncharLocal: any = null

  for (var char of answerChars) {
    var entry = similarCache[char]
    if (!entry) {
      if (!cncharLocal) { var c = (await import('cnchar')).default; await import('cnchar-trad'); cncharLocal = c }
      try {
        var trad = cncharLocal.convert.simpleToTrad(char)
        if (trad !== char) entry = similarCache[trad]
      } catch (e) { /* skip */ }
    }
    if (entry) {
      var laArr = entry.lookalikes.filter(function(c) { return c !== char && !result.includes(c) && !answerChars.includes(c) })
      for (var la of laArr) {
        if (result.length >= count) break
        if (cncharLocal) {
          try {
            var s = cncharLocal.convert.tradToSimple(la)
            if (!result.includes(s) && !answerChars.includes(s)) { result.push(s); continue }
          } catch (e) { /* skip */ }
        }
        if (!result.includes(la) && !answerChars.includes(la)) result.push(la)
      }
    }
    if (result.length >= count) break
  }

  // Fallback to random chars if not enough lookalikes
  while (result.length < count) {
    var extra = OPTION_POOL.split('').filter(function(c) { return !answerChars.includes(c) && !result.includes(c) })
    if (extra.length === 0) break
    result.push(extra[Math.floor(Math.random() * extra.length)])
  }

  return shuffle(result)
}

export default function PoemFill() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var pool = poems.filter(function(p) { return (p.type === '诗' || p.type === '词') && p.content.length >= 2 && p.content.length <= 8 && p.content.join('').length <= 40 })

  var [poem, setPoem] = useState<any>(null)
  var [blanks, setBlanks] = useState<{ lineIdx: number; charIdx: number; answer: string }[]>([])
  var [filled, setFilled] = useState<Record<string, string>>({})
  var [options, setOptions] = useState<string[]>([])
  var [result, setResult] = useState<'success' | 'error' | null>(null)
  var [fillOrder, setFillOrder] = useState<string[]>([])
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)
  var [showConfetti, setShowConfetti] = useState(false)

  async function initGame() {
    if (pool.length === 0) return
    var p = pool[Math.floor(Math.random() * pool.length)]
    setPoem(p)

    var allBlanks: { lineIdx: number; charIdx: number; answer: string }[] = []

    for (var li = 0; li < p.content.length; li++) {
      var line = p.content[li]
      var chars = line.split('')
      for (var ci = 0; ci < chars.length; ci++) {
        if (/[\u4e00-\u9fff]/.test(chars[ci]) && Math.random() < 0.25) {
          allBlanks.push({ lineIdx: li, charIdx: ci, answer: chars[ci] })
        }
      }
    }

    if (allBlanks.length < 2) { initGame(); return }

    // pick up to 5 blanks
    var selected = shuffle(allBlanks).slice(0, 5)
    selected.sort(function(a, b) { return a.lineIdx !== b.lineIdx ? a.lineIdx - b.lineIdx : a.charIdx - b.charIdx })

    var targetCount = selected.length * 2
    var answerChars = selected.map(function(s) { return s.answer })
    var poemDistractors = p.content.join('').split('').filter(function(c) { return /[\u4e00-\u9fff]/.test(c) && !selected.some(function(s) { return s.answer === c }) })
    var lookalikeDistractors = await getLookalikeDistractors(answerChars, targetCount - selected.length)

    var optChars = shuffle([...answerChars, ...poemDistractors.slice(0, Math.ceil((targetCount - selected.length) / 2)), ...lookalikeDistractors])
    setBlanks(selected)
    setOptions(shuffle(optChars))
    setFilled({})
    setResult(null)
    setFillOrder([])
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (pool.length > 0) initGame() }, [pool.length])
  useEffect(function() {
    if (result || startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [result, startTime])

  function selectChar(ch: string) {
    var nextBlank = blanks.find(function(b) { var k = b.lineIdx + '-' + b.charIdx; return !filled[k] })
    if (!nextBlank) return
    var key = nextBlank.lineIdx + '-' + nextBlank.charIdx
    var newFilled = { ...filled, [key]: ch }
    setFilled(newFilled)
    setFillOrder(function(prev) { return [...prev, key] })
    // Check if all filled
    if (Object.keys(newFilled).length === blanks.length) {
      var correct = blanks.every(function(b) { return newFilled[b.lineIdx + '-' + b.charIdx] === b.answer })
      setResult(correct ? 'success' : 'error')
      if (correct) { playTone(true); setShowConfetti(true); setTimeout(function() { setShowConfetti(false) }, 3000); if (poem) db.gameRecords.add({ game: '填空', poemTitle: poem.title, poemAuthor: poem.author, elapsed: elapsed, success: true, createdAt: new Date() }) }
      else playTone(false)
    }
  }

  function clearFilled() { setFilled({}); setResult(null); setFillOrder([]) }

  function undo() {
    if (fillOrder.length === 0) return
    var last = fillOrder[fillOrder.length - 1]
    setFillOrder(function(prev) { return prev.slice(0, -1) })
    setFilled(function(prev) {
      var next = { ...prev }
      delete next[last]
      return next
    })
    setResult(null)
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词填空</span>
        <div className="flex-1" />
        <MuteButton />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        {poem && (
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-primary">{poem.title}</h2>
            <p className="text-sm text-muted-foreground">{poem.author} · {poem.dynasty}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-3 text-center">从下方候选字中选择填入空白处</p>

        {/* Poem with blanks */}
        <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-6 mb-4">
          {poem && poem.content.map(function(line: string, li: number) {
            var chars = line.split('')
            return (
              <p key={li} className="text-center text-lg leading-8 lg:text-xl lg:leading-10 font-poem tracking-wide mb-1">
                {chars.map(function(ch: string, ci: number) {
                  var blank = blanks.find(function(b) { return b.lineIdx === li && b.charIdx === ci })
                  if (!blank) return <span key={ci} className="inline-flex items-center justify-center align-middle w-7 h-8 lg:w-8 lg:h-9 text-base lg:text-lg">{ch}</span>
                  var key = li + '-' + ci
                  var val = filled[key]
                  var isWrong = result === 'error' && val && val !== blank.answer
                  return (
                    <span key={ci} className={'inline-flex items-center justify-center align-middle mx-[1px] w-7 h-8 lg:w-8 lg:h-9 rounded text-base lg:text-lg border-2 leading-none ' + (val ? (isWrong ? 'border-red-400 bg-red-50 text-red-500 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400' : 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400') : 'border-dashed border-muted-foreground/80 bg-muted/30')}>
                      {val || ''}
                    </span>
                  )
                })}
              </p>
            )
          })}
        </div>

        {/* Option pool */}
        <div className="flex flex-wrap gap-2 justify-center mb-4 min-h-[44px]">
          {options.map(function(ch, i) {
            var used = Object.values(filled).includes(ch)
            return (
              <button key={i} onClick={function() { if (!used) selectChar(ch) }}
                disabled={used}
                className={'w-9 h-9 rounded-lg text-base font-medium transition-all ' + (used ? 'bg-muted text-muted-foreground/30 line-through' : 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer')}>
                {ch}
              </button>
            )
          })}
        </div>

        {/* Result */}
        {result && (
          <div className={'px-4 py-2 text-center font-semibold rounded-lg mb-4 ' + (result === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400')}>
            {result === 'success' ? '🎉 全部正确！用时 ' + elapsed + '秒' : '❌ 有些字不对哦'}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 再来一次
          </button>
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一首
          </button>
          {fillOrder.length > 0 && !result && (
            <button onClick={undo} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
              <Undo2 className="h-3.5 w-3.5" /> 撤回
            </button>
          )}
          {result === 'error' && (
            <button onClick={clearFilled} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors card-hover">
              重新填写
            </button>
          )}
        </div>
        <div className="flex justify-center mt-3">
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
            🏆 记录
          </button>
        </div>
      </div>
      {showRecords && <RecordsModal game="填空" open={true} onClose={function() { setShowRecords(false) }} />}
      <Celebration show={showConfetti} />
    </div>
  )
}
