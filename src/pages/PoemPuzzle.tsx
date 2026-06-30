import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'

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

  function initGame() {
    var filtered = poems.filter(function(p) { return (p.type === '诗' || p.type === '词') && p.content.length >= 2 && p.content.join('').replace(/[，。！？、\s]/g, '').length <= 30 })
    if (filtered.length === 0) return
    var p = filtered[Math.floor(Math.random() * filtered.length)]
    setPoem(p)

    var chars: string[] = []
    for (var i = 0; i < p.content.length; i++) {
      var line = p.content[i]
      for (var j = 0; j < line.length; j++) {
        if (/[\u4e00-\u9fff]/.test(line[j])) chars.push(line[j])
      }
    }

    setTarget(chars)
    setFilled(new Array(chars.length).fill(null))

    var shuffled = shuffle([...chars])
    // Ensure not identical to target
    if (shuffled.every(function(c, idx) { return c === chars[idx] })) {
      shuffled = shuffle([...chars])
    }
    setPool(shuffled)
    setCompleted(false)
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) initGame() }, [poems.length])

  // Timer
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

    // Check if all filled
    if (next.indexOf(null) === -1) {
      var correct = next.every(function(c, i) { return c === target[i] })
      setCompleted(correct)
      if (correct) { playTone(true); if (poem) db.gameRecords.add({ game: '拼图', poemTitle: poem.title, poemAuthor: poem.author, elapsed: elapsed, success: true, createdAt: new Date() }) }
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
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold text-primary">{poem.title}</h2>
            <p className="text-sm text-muted-foreground">{poem.author} · {poem.dynasty}</p>
          </div>
        )}

        {completed && <div className="text-center text-sm font-semibold text-emerald-600 mb-3">🎉 完成！用时 {elapsed} 秒</div>}

        {/* Hint display - target squares */}
        {poem && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground text-center mb-2">点击下方汉字填入正确位置</p>
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
                          className={'w-8 h-8 lg:w-10 lg:h-10 rounded-lg border-2 text-sm lg:text-base font-poem font-medium transition-all cursor-pointer flex items-center justify-center ' + (val ? (isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : isWrong ? 'border-red-400 bg-red-50 text-red-600' : 'border-primary bg-primary/10 text-foreground') : 'border-dashed border-muted-foreground/40 bg-muted/30')}>
                          {val || ''}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pool */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-4 min-h-[40px]">
          {pool.map(function(ch, i) {
            return (
              <button key={i} onClick={function() { selectChar(ch) }}
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg border-2 border-primary/30 bg-primary/5 text-foreground text-sm lg:text-base font-poem font-medium hover:bg-primary/10 transition-colors cursor-pointer">
                {ch}
              </button>
            )
          })}
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
    </div>
  )
}

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }

function playTone(_correct: boolean) {
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
