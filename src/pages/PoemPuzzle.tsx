import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'
import Celebration from '../components/Celebration'

var COMMON_CHARS = '天地人日月星辰风云雨雪山河水火木金花鸟虫鱼春夏秋冬东西南北中大长高远近来去古往今声色光影梦魂心意情愁恨爱思知见闻说读写歌吟叹喜怒哀乐悲欢离合生死安危冷暖清浊深浅明暗'

export default function PoemPuzzle() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var [pool, setPool] = useState<string[]>([])
  var [target, setTarget] = useState<string[]>([])
  var [filled, setFilled] = useState<(string | null)[]>([])
  var [completed, setCompleted] = useState(false)
  var [poem, setPoem] = useState<any>(null)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)
  var [showConfetti, setShowConfetti] = useState(false)
  var [poolSize, setPoolSize] = useState(4)

  function initGame() {
    var filtered = poems.filter(function(p) {
      if (p.type !== '诗' && p.type !== '词') return false
      if (p.content.length < 2) return false
      var count = 0
      for (var i = 0; i < p.content.length; i++) {
        for (var j = 0; j < p.content[i].length; j++) {
          if (/[\u4e00-\u9fff]/.test(p.content[i][j])) count++
        }
      }
      return count >= 6 && count <= 30
    })
    if (filtered.length === 0) return

    var p = filtered[Math.floor(Math.random() * filtered.length)]
    setPoem(p)

    var poemChars: string[] = []
    for (var i = 0; i < p.content.length; i++) {
      var line = p.content[i]
      for (var j = 0; j < line.length; j++) {
        if (/[\u4e00-\u9fff]/.test(line[j])) poemChars.push(line[j])
      }
    }

    // Target = poem characters only (in order)
    setTarget(poemChars)
    setFilled(new Array(poemChars.length).fill(null))

    // Pool = poem chars + filler chars, arranged in N×N matrix
    var N = Math.ceil(Math.sqrt(poemChars.length + Math.min(poemChars.length, 12)))
    if (N < 4) N = 4
    var totalPool = N * N
    var fillerCount = totalPool - poemChars.length

    var commonArr = COMMON_CHARS.split('')
    var fillerChars: string[] = []
    for (var i = 0; i < fillerCount; i++) {
      fillerChars.push(commonArr[Math.floor(Math.random() * commonArr.length)])
    }

    var shuffled = shuffle([...poemChars, ...fillerChars])
    if (shuffled.slice(0, poemChars.length).every(function(c, idx) { return c === poemChars[idx] })) {
      shuffled = shuffle([...poemChars, ...fillerChars])
    }
    setPool(shuffled)
    setPoolSize(N)
    setCompleted(false)
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) initGame() }, [poems.length])

  useEffect(function() {
    if (completed || startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [completed, startTime])

  function selectChar(ch: string) {
    if (completed) return
    var idx = filled.indexOf(null)
    if (idx === -1) return
    var next = [...filled]
    next[idx] = ch
    setFilled(next)
    setPool(function(prev) { var idx = prev.indexOf(ch); return idx >= 0 ? prev.filter(function(_: string, i: number) { return i !== idx }) : prev })

    if (next.indexOf(null) === -1) {
      var correct = next.every(function(c, i) { return c === target[i] })
      setCompleted(correct)
      if (correct) { playTone(); setShowConfetti(true); setTimeout(function() { setShowConfetti(false) }, 3000); if (poem) db.gameRecords.add({ game: '拼图', poemTitle: poem.title, poemAuthor: poem.author, elapsed: elapsed, success: true, createdAt: new Date() }) }
    }
  }

  function removeChar(idx: number) {
    if (completed) return
    var ch = filled[idx]
    if (!ch) return
    var next = [...filled]
    next[idx] = null
    setFilled(next)
    setPool(function(prev) { return ch ? [...prev, ch] : prev })
  }

  function undo() {
    var lastIdx = -1
    for (var i = filled.length - 1; i >= 0; i--) { if (filled[i] !== null) { lastIdx = i; break } }
    if (lastIdx < 0) return
    removeChar(lastIdx)
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词拼图</span>
        <div className="flex-1" />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        {poem && (
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-primary">{poem.title}</h2>
            <p className="text-sm text-muted-foreground">{poem.author} · {poem.dynasty}</p>
          </div>
        )}

        {completed && <div className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">🎉 完成！用时 {elapsed} 秒</div>}

        <p className="text-xs text-muted-foreground text-center mb-3">
          从下方 {poolSize}×{poolSize} 字矩阵中选出正确文字填入诗句
        </p>

        {/* Filled slots in poem line layout */}
        {poem && (
          <div className="mb-4">
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-2">
              {poem.content.map(function(line: string, li: number) {
                var startIdx = 0
                for (var si = 0; si < li; si++) {
                  startIdx += poem.content[si].split('').filter(function(c: string) { return /[\u4e00-\u9fff]/.test(c) }).length
                }
                var chars = line.split('').filter(function(c: string) { return /[\u4e00-\u9fff]/.test(c) })
                return (
                  <div key={li} className="flex items-center gap-0.5">
                    {chars.map(function(_ch: string, ci: number) {
                      var idx = startIdx + ci
                      var val = filled[idx]
                      var isCorrect = completed || (val && val === target[idx])
                      var isWrong = val && val !== target[idx]
                      return (
                        <button key={idx} onClick={function() { if (val) removeChar(idx) }}
                          className={'w-8 h-8 lg:w-10 lg:h-10 rounded-lg border-2 text-sm lg:text-base font-poem font-medium transition-all cursor-pointer flex items-center justify-center ' + (val ? (isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : isWrong ? 'border-red-400 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400' : 'border-primary bg-primary/10 text-foreground') : 'border-dashed border-muted-foreground/40 bg-muted/30')}>
                          {val || ''}
                        </button>
                      )
                    })}
                    {li < poem.content.length - 1 && <span className="text-muted-foreground/20 mx-0.5 select-none">|</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pool matrix grid */}
        <p className="text-xs text-muted-foreground text-center mb-2">候选字</p>
        <div className="flex justify-center mb-4">
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(' + poolSize + ', minmax(0, 1fr))' }}>
            {pool.map(function(ch, i) {
              return (
                <button key={i} onClick={function() { selectChar(ch) }}
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 border-primary/30 bg-primary/5 text-foreground text-sm lg:text-base font-poem font-medium hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer">
                  {ch}
                </button>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 再来一次
          </button>
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一首
          </button>
          {filled.some(function(f) { return f !== null }) && !completed && (
            <button onClick={undo} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
              撤回一步
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
      {showRecords && <RecordsModal game="拼图" open={true} onClose={function() { setShowRecords(false) }} />}
      <Celebration show={showConfetti} />
    </div>
  )
}

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }

function playTone() {
  try {
    var ctx = new AudioContext()
    var osc = ctx.createOscillator()
    var gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination); gain.gain.value = 0.15
    osc.frequency.setValueAtTime(523, ctx.currentTime); osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12); osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
    setTimeout(function() { ctx.close() }, 500)
  } catch (e) { /* silent */ }
}
