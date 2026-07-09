import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { db } from '../lib/db'
import { playTone } from '../lib/audio'
import { ArrowLeft, RefreshCw, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RecordsModal from '../components/RecordsModal'
import Celebration from '../components/Celebration'
import MuteButton from '../components/MuteButton'

var COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16']

export default function PoemMatch() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var [cards, setCards] = useState<{ id: number; text: string; pairId: number; poemTitle: string }[]>([])
  var [selected, setSelected] = useState<number[]>([])
  var [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set())
  var [moves, setMoves] = useState(0)
  var [gamePoems, setGamePoems] = useState<any[]>([])
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [showRecords, setShowRecords] = useState(false)
  var [showConfetti, setShowConfetti] = useState(false)
  var [wrongPair, setWrongPair] = useState<number[]>([])
  var doneRef = useRef(false)
  var allMatched = false

  function initGame() {
    var pool = poems.filter(function(p) {
      if (p.type !== '诗' && p.type !== '词') return false
      var lines = p.content.filter(function(l: string) { return l.replace(/[（(][^）)]*[）)]/g, '').trim().length > 0 })
      return lines.length >= 4
    })
    if (pool.length < 2) return

    // Pick 2-3 poems
    var poemCount = Math.random() < 0.4 ? 2 : 3
    var selected: any[] = []
    var shuffled = shuffle(pool)
    for (var i = 0; i < shuffled.length && selected.length < poemCount; i++) {
      selected.push(shuffled[i])
    }
    if (selected.length < 2) return
    setGamePoems(selected)

    var cardList: { id: number; text: string; pairId: number; poemTitle: string }[] = []
    var globalPairIdx = 0

    for (var pi = 0; pi < selected.length; pi++) {
      var p = selected[pi]
      var lines = p.content.filter(function(l: string) { return l.trim().length > 0 }).map(function(l: string) { return l.replace(/[（(][^）)]*[）)]/g, '').trim() }).filter(function(l: string) { return l.length > 0 }).slice(0, 8)
      var maxPairs = Math.min(Math.floor(lines.length / 2), 3)

      var taken = 0
      for (var li = 0; li < lines.length - 1 && taken < maxPairs; li += 2) {
        cardList.push({ id: globalPairIdx * 2, text: lines[li], pairId: globalPairIdx, poemTitle: p.title })
        cardList.push({ id: globalPairIdx * 2 + 1, text: lines[li + 1], pairId: globalPairIdx, poemTitle: p.title })
        globalPairIdx++
        taken++
      }
    }

    if (cardList.length < 4) { initGame(); return }

    setCards(shuffle(cardList))
    setSelected([])
    setMatchedPairs(new Set())
    setMoves(0)
    doneRef.current = false
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { if (poems.length > 0) initGame() }, [poems.length])
  useEffect(function() {
    if (startTime === 0) return
    var id = setInterval(function() { if (!doneRef.current) setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [startTime])

  useEffect(function() {
    if (allMatched && gamePoems.length > 0) {
      setTimeout(function() { playTone(true); playTone(true) }, 300)
      setShowConfetti(true); setTimeout(function() { setShowConfetti(false) }, 3000)
      db.gameRecords.add({ game: '连连看', poemTitle: gamePoems.map(function(p) { return p.title }).join('、'), poemAuthor: gamePoems.map(function(p) { return p.author }).join('、'), elapsed: elapsed, success: true, createdAt: new Date() })
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
        setMatchedPairs(function(prev) { var next = new Set([...prev, c1.pairId]); if (next.size === cards.length / 2) doneRef.current = true; return next })
        setSelected([])
        playTone(true)
      } else {
        playTone(false)
        setWrongPair(newSelected)
        setTimeout(function() { setSelected([]); setWrongPair([]) }, 600)
      }
    } else {
      setSelected(newSelected)
    }
  }

  allMatched = cards.length > 0 && matchedPairs.size === cards.length / 2

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词连连看</span>
        <div className="flex-1" />
        <MuteButton />
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {cards.map(function(card) {
            var isSelected = selected.includes(card.id)
            var isMatched = matchedPairs.has(card.pairId)
            var isWrong = wrongPair.includes(card.id)
            var isLong = card.text.length > 10
            return (
              <button key={card.id} onClick={function() { if (!isMatched) selectCard(card.id) }}
                className={'min-h-[5rem] rounded-xl font-poem tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center px-2 py-3 ' + (isLong ? 'text-xs' : 'text-sm') + ' ' + (isWrong ? 'ring-2 ring-red-500 animate-shake ' : '') + (isMatched ? 'border-2 border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : isSelected ? 'ring-2 ring-offset-1 ring-primary scale-105 shadow-md text-white' : 'text-white hover:brightness-110 shadow-sm')}
                style={isMatched ? {} : { backgroundColor: COLORS[card.id % COLORS.length], border: '2px solid ' + COLORS[card.id % COLORS.length] }}>
                {card.text}
              </button>
            )
          })}
        </div>

        {/* Matched pairs display */}
        {matchedPairs.size > 0 && (
          <div className="mb-4 space-y-1.5">
            {Array.from(matchedPairs).sort().map(function(pairId) {
              var pair = cards.filter(function(c) { return c.pairId === pairId })
              if (pair.length !== 2) return null
              return (
                <div key={pairId} className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/70 font-poem leading-6 justify-center">
                    <span>{pair[0].text}</span>
                    <span className="text-muted-foreground/30">→</span>
                    <span>{pair[1].text}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40">{pair[0].poemTitle}</span>
                </div>
              )
            })}
          </div>
        )}

        {allMatched && (
          <div className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4">🎉 全部匹配！共用 {moves} 步</div>
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
      <Celebration show={showConfetti} />
    </div>
  )
}

function shuffle<T>(a: T[]) { var arr = [...a]; for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }; return arr }
