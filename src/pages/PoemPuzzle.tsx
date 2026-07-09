import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../lib/db'
import { playTone } from '../lib/audio'
import { ArrowLeft, RefreshCw, RotateCcw, Lightbulb, Share2 } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'
import Celebration from '../components/Celebration'
import MuteButton from '../components/MuteButton'

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
  var [showHint, setShowHint] = useState(false)
  var [showShare, setShowShare] = useState(false)
  var shareRef = useRef<HTMLDivElement>(null)

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
      var line = p.content[i].replace(/[（(][^）)]*[）)]/g, '').trim()
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
      if (correct) { playTone(true); setShowConfetti(true); setTimeout(function() { setShowConfetti(false) }, 3000); if (poem) db.gameRecords.add({ game: '拼图', poemTitle: poem.title, poemAuthor: poem.author, elapsed: elapsed, success: true, createdAt: new Date() }) }
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
        <MuteButton />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        {poem && completed && (
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-primary">{poem.title}</h2>
            <p className="text-sm text-muted-foreground">{poem.author} · {poem.dynasty}</p>
          </div>
        )}

        {completed && <div className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">🎉 完成！用时 {elapsed} 秒</div>}

        <p className="text-xs text-muted-foreground text-center mb-3">
          点击上方矩阵中的汉字，填入下方诗句的空白处
        </p>

        {/* Pool matrix grid */}
        <div className="flex justify-center mb-4">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(' + poolSize + ', minmax(0, 1fr))' }}>
            {pool.map(function(ch, i) {
              return (
                <button key={i} onClick={function() { selectChar(ch) }}
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl border-2 border-border bg-card text-foreground text-sm lg:text-base font-poem font-medium shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer">
                  {ch}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filled slots in poem line layout */}
        {poem && (
          <div className="mb-4">
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-2">
              {poem.content.map(function(line: string, li: number) {
                var cleanLine = line.replace(/[（(][^）)]*[）)]/g, '').trim()
                if (cleanLine.length === 0) return null
                var startIdx = 0
                for (var si = 0; si < li; si++) {
                  var prevLine = poem.content[si].replace(/[（(][^）)]*[）)]/g, '').trim()
                  startIdx += prevLine.split('').filter(function(c: string) { return /[\u4e00-\u9fff]/.test(c) }).length
                }
                var chars = cleanLine.split('').filter(function(c: string) { return /[\u4e00-\u9fff]/.test(c) })
                return (
                  <div key={li} className="flex items-center gap-1.5">
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
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 再来一次
          </button>
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一首
          </button>
          {poem && !completed && (
            <button onClick={function() { setShowHint(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
              <Lightbulb className="h-3.5 w-3.5" /> 提示
            </button>
          )}
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
          <button onClick={function() { setShowShare(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer ml-2">
            <Share2 className="h-3 w-3" /> 分享
          </button>
        </div>
      </div>
      {showHint && poem && (
        <div onClick={function() { setShowHint(false) }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div onClick={function(e) { e.stopPropagation() }} className="rounded-xl bg-card p-6 shadow-xl max-w-sm mx-4 text-center">
            <h3 className="text-lg font-bold text-primary mb-1">{poem.title}</h3>
            <p className="text-sm text-muted-foreground">{poem.author} · {poem.dynasty}</p>
            <button onClick={function() { setShowHint(false) }}
              className="mt-4 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              知道了
            </button>
          </div>
        </div>
      )}
      {showRecords && <RecordsModal game="拼图" open={true} onClose={function() { setShowRecords(false) }} />}
      <Celebration show={showConfetti} />

      {/* Share modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-background p-6 shadow-xl mx-4 flex flex-col items-center gap-4" style={{ width: 360 }}>
            {/* Share content to capture */}
            <div ref={shareRef} style={{ width: 320, height: 427, aspectRatio: '3/4', backgroundColor: '#ffffff', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4, fontFamily: 'sans-serif' }}>诗词拼图</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 24, fontFamily: 'sans-serif' }}>点击上方汉字矩阵，填入诗句空白处</div>
              {function() { var gap = 4; var containerW = 272; var cellW = Math.floor((containerW - gap * (poolSize - 1)) / poolSize); return (<div style={{ display: 'flex', flexWrap: 'wrap', width: containerW, gap: gap }}>
                {pool.map(function(ch, i) {
                  return (
                    <div key={i}
                      style={{ width: cellW, height: cellW, borderRadius: 8, border: '2px solid #e5e7eb', backgroundColor: '#ffffff', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'serif', color: '#111827' }}>
                        {ch}
                      </div>
                    </div>
                  )
                })}
              </div>) }()}
            </div>
            <div className="flex gap-3">
              <button onClick={async function() {
                try {
                  var domtoimage = (await import('dom-to-image-more')).default
                  var dataUrl = await domtoimage.toPng(shareRef.current!, { bgcolor: '#ffffff', scale: 3 })
                  var link = document.createElement('a')
                  link.download = '诗词拼图-' + (poem?.title || '未知') + '.png'
                  link.href = dataUrl
                  link.click()
                  setShowShare(false)
                } catch (e) { console.error(e) }
              }}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                保存图片
              </button>
              <button onClick={function() { setShowShare(false) }}
                className="px-5 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }
