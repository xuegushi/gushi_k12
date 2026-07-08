import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../lib/db'
import { playTone } from '../lib/audio'
import { ArrowLeft, RefreshCw, RotateCcw, ArrowRight, ArrowLeft as ArrowLeftIcon } from 'lucide-react'
import RecordsModal from '../components/RecordsModal'
import Celebration from '../components/Celebration'
import MuteButton from '../components/MuteButton'

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }

export default function PoemChainLink() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var [mode, setMode] = useState<'forward' | 'backward'>('forward')
  var [givenLine, setGivenLine] = useState('')
  var [correctAnswer, setCorrectAnswer] = useState('')
  var [options, setOptions] = useState<string[]>([])
  var [selectedOption, setSelectedOption] = useState<string | null>(null)
  var [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  var [poemTitle, setPoemTitle] = useState('')
  var [poemAuthor, setPoemAuthor] = useState('')
  var [score, setScore] = useState(0)
  var [streak, setStreak] = useState(0)
  var [maxStreak, setMaxStreak] = useState(0)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)
  var [showConfetti, setShowConfetti] = useState(false)

  function pickQuestion() {
    var filtered = poems.filter(function(p) { return (p.type === '诗' || p.type === '词') && p.content.length >= 4 })
    if (filtered.length === 0) return

    var p = filtered[Math.floor(Math.random() * filtered.length)]

    // Pick a consecutive line pair
    var maxPair = Math.floor(p.content.length / 2)
    var pairIdx = Math.floor(Math.random() * maxPair)
    var lineIdx = pairIdx * 2
    var upper = p.content[lineIdx]
    var lower = p.content[lineIdx + 1]

    var isForward = mode === 'forward'
    setGivenLine(isForward ? upper : lower)
    setCorrectAnswer(isForward ? lower : upper)
    setPoemTitle(p.title)
    setPoemAuthor(p.author)

    // Generate 3 wrong answers from other poems' lines
    var otherLines: string[] = []
    var poolSize = 0
    while (otherLines.length < 3 && poolSize < filtered.length) {
      var other = filtered[Math.floor(Math.random() * filtered.length)]
      if (other.title === p.title) { poolSize++; continue }
      for (var li = 0; li < other.content.length && otherLines.length < 3; li++) {
        var line = other.content[li]
        if (line !== upper && line !== lower && !otherLines.includes(line)) {
          otherLines.push(line)
        }
      }
      poolSize++
    }

    var correct = isForward ? lower : upper
    setOptions(shuffle([correct, ...otherLines.slice(0, 3)]))
    setSelectedOption(null)
    setResult(null)
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) pickQuestion() }, [poems.length, mode])

  useEffect(function() {
    if (result || startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [result, startTime])

  function selectOption(opt: string) {
    if (result) return
    setSelectedOption(opt)
    var isCorrect = opt === correctAnswer
    setResult(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      playTone(true)
      setShowConfetti(true); setTimeout(function() { setShowConfetti(false) }, 3000)
      setScore(function(p) { return p + 10 + streak * 2 })
      setStreak(function(p) { return p + 1 })
      setMaxStreak(function(prev) { return Math.max(prev, streak + 1) })
      if (poemTitle) db.gameRecords.add({ game: '接龙', poemTitle: poemTitle, poemAuthor: poemAuthor, elapsed: elapsed, success: true, createdAt: new Date() })
    } else {
      playTone(false)
      setStreak(0)
      if (poemTitle) db.gameRecords.add({ game: '接龙', poemTitle: poemTitle, poemAuthor: poemAuthor, elapsed: elapsed, success: false, createdAt: new Date() })
    }
  }

  function nextQuestion() { pickQuestion() }

  function toggleMode() {
    setMode(function(prev) { return prev === 'forward' ? 'backward' : 'forward' })
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词接龙</span>
        <div className="flex-1" />
        <MuteButton />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-primary">诗词接龙</h2>
          <p className="text-sm text-muted-foreground">选出正确的上句或下句</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-3">
          <span>得分：<span className="text-foreground font-medium">{score}</span></span>
          <span>连击：<span className={'font-medium ' + (streak > 0 ? 'text-orange-500' : 'text-foreground')}>{streak}</span></span>
          {startTime > 0 && <span>⏱ {elapsed}秒</span>}
          {maxStreak > 0 && <span>最高连击：<span className="text-foreground font-medium">{maxStreak}</span></span>}
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center mb-4">
          <div className="flex rounded-full bg-muted p-0.5 text-xs">
            <button onClick={function() { if (mode !== 'forward') { setMode('forward'); setResult(null); setSelectedOption(null) } }}
              className={'flex items-center gap-1 px-4 py-1.5 rounded-full transition-colors ' + (mode === 'forward' ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
              <ArrowRight className="h-3.5 w-3.5" /> 顺接
            </button>
            <button onClick={function() { if (mode !== 'backward') { setMode('backward'); setResult(null); setSelectedOption(null) } }}
              className={'flex items-center gap-1 px-4 py-1.5 rounded-full transition-colors ' + (mode === 'backward' ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
              <ArrowLeftIcon className="h-3.5 w-3.5" /> 逆接
            </button>
          </div>
        </div>

        {givenLine && (
          <div className="rounded-xl bg-gradient-to-b from-primary/10 to-primary/5 p-5 mb-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">{mode === 'forward' ? '请选出下句' : '请选出上句'}</p>
            <p className="text-lg lg:text-xl font-poem font-medium text-primary leading-8">{givenLine}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2 mb-4">
          {options.map(function(opt) {
            var isSelected = selectedOption === opt
            var isCorrect = result && opt === correctAnswer
            var isWrong = result && isSelected && opt !== correctAnswer
            return (
              <button key={opt} onClick={function() { selectOption(opt) }}
                disabled={!!result}
                className={'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-poem leading-6 transition-all cursor-pointer ' + (isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : isWrong ? 'border-red-400 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400' : isSelected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card hover:border-primary/30 text-foreground')}>
                {opt}
              </button>
            )
          })}
        </div>

        {result && (
          <div className={'text-center text-sm font-medium mb-3 ' + (result === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {result === 'correct' ? '🎉 正确！' : '❌ 不对哦'}
            <span className="text-xs text-muted-foreground ml-2">《{poemTitle}》- {poemAuthor}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button onClick={toggleMode} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 切换模式
          </button>
          <button onClick={nextQuestion} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> {result ? '下一题' : '换一题'}
          </button>
        </div>
        <div className="flex justify-center mt-3">
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
            🏆 记录
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">💡 每题 10 分，连击额外加分</p>
      </div>
      {showRecords && <RecordsModal game="接龙" open={true} onClose={function() { setShowRecords(false) }} />}
      <Celebration show={showConfetti} />
    </div>
  )
}
