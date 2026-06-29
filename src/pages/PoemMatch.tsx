import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RecordsModal from '../components/RecordsModal'

export default function PoemMatch() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var [cards, setCards] = useState<{ id: number; text: string; pairId: number }[]>([])
  var [selected, setSelected] = useState<number[]>([])
  var [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set())
  var [moves, setMoves] = useState(0)
  var [poem, setPoem] = useState<any>(null)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)

  function initGame() {
    var pool = poems.filter(function(p) { return (p.type === '诗' || p.type === '词') && p.content.length >= 4 && p.grade >= 1 && p.grade <= 6 })
    if (pool.length === 0) return

    var p = pool[Math.floor(Math.random() * pool.length)]
    setPoem(p)
    var lines = p.content.slice(0, Math.min(p.content.length, 6))
    if (lines.length < 4 || lines.length % 2 !== 0) { initGame(); return }

    // Pair consecutive lines (1↔2, 3↔4, ...)
    var cardList: { id: number; text: string; pairId: number }[] = []
    var pairIdx = 0
    for (var i = 0; i < lines.length; i += 2) {
      cardList.push({ id: pairIdx * 2, text: lines[i], pairId: pairIdx })
      cardList.push({ id: pairIdx * 2 + 1, text: lines[i + 1], pairId: pairIdx })
      pairIdx++
    }

    setCards(shuffle(cardList))
    setSelected([])
    setMatchedPairs(new Set())
    setMoves(0)
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) initGame() }, [poems.length])
  useEffect(function() {
    if (allMatched || startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [allMatched, startTime])

  useEffect(function() {
    if (allMatched) {
      setTimeout(function() { playTone(true); playTone(true) }, 300)
      if (poem) db.gameRecords.add({ game: '连连看', poemTitle: poem.title, poemAuthor: poem.author, elapsed: elapsed, success: true, createdAt: new Date() })
    }
  }, [allMatched])

  function selectCard(id: number) {
    if (selected.includes(id) || matchedPairs.has(cards.find(function(c) { return c.id === id })!.pairId)) return

    var newSelected = [...selected, id]

    if (newSelected.length === 2) {
      setMoves(function(p) { return p + 1 })
      var c1 = cards.find(function(c) { return c.id === newSelected[0] })!
      var c2 = cards.find(function(c) { return c.id === newSelected[1] })!
      if (c1.pairId === c2.pairId) {
        setMatchedPairs(function(prev) { return new Set([...prev, c1.pairId]) })
        setSelected([])
        playTone(true)
      } else {
        playTone(false)
        setTimeout(function() { setSelected([]) }, 600)
      }
    } else {
      setSelected(newSelected)
    }
  }

  var allMatched = cards.length > 0 && matchedPairs.size === cards.length / 2

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词连连看</span>
        <div className="flex-1" />
      </div>

      <div className="flex flex-col max-w-3xl mx-auto w-full">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-primary">诗词连连看</h2>
          <p className="text-sm text-muted-foreground">找出上下句配对</p>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-4">
          <span>步数：<span className="text-foreground font-medium">{moves}</span></span>
          <span>已匹配：<span className="text-foreground font-medium">{matchedPairs.size}</span>/{cards.length / 2}</span>
          {startTime > 0 && <span>⏱ {elapsed}秒</span>}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {cards.map(function(card) {
            var isSelected = selected.includes(card.id)
            var isMatched = matchedPairs.has(card.pairId)
            return (
              <button key={card.id} onClick={function() { if (!isMatched) selectCard(card.id) }}
                className={'h-20 rounded-xl border-2 text-sm font-poem tracking-wide transition-all duration-200 cursor-pointer ' + (isMatched ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60' : isSelected ? 'border-primary bg-primary/10 text-foreground shadow-md' : 'border-border bg-card text-muted-foreground hover:border-primary/30')}>
                {card.text}
              </button>
            )
          })}
        </div>

        {allMatched && (
          <div className="text-center text-sm font-semibold text-emerald-600 mb-4">🎉 全部匹配！共用 {moves} 步</div>
        )}

        <div className="flex gap-2 justify-center">
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 再来一次
          </button>
          <button onClick={initGame} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一组
          </button>
        </div>
        <div className="flex justify-center mt-3">
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
            🏆 记录
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">💡 点击两句配对，匹配的两句会保留高亮</p>
      </div>
      {showRecords && <RecordsModal game="连连看" open={true} onClose={function() { setShowRecords(false) }} />}
    </div>
  )
}

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }

function playTone(correct: boolean) {
  try {
    var ctx = new AudioContext()
    var osc = ctx.createOscillator()
    var gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination); gain.gain.value = 0.15
    if (correct) { osc.frequency.setValueAtTime(523, ctx.currentTime); osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12); osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24) }
    else { osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.setValueAtTime(300, ctx.currentTime + 0.2) }
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + (correct ? 0.4 : 0.35))
    setTimeout(function() { ctx.close() }, 500)
  } catch (e) { /* silent */ }
}
