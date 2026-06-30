import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { db } from '../lib/db'
import { ArrowLeft, RefreshCw, RotateCcw, Trophy, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RecordsModal from '../components/RecordsModal'

interface Segment {
  id: string
  text: string
  lineIdx: number
}

function playTone(correct: boolean) {
  try {
    var ctx = new AudioContext()
    var osc = ctx.createOscillator()
    var gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.value = 0.15
    if (correct) {
      osc.frequency.setValueAtTime(523, ctx.currentTime)       // C5
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12) // E5
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24) // G5
    } else {
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.2)
    }
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + (correct ? 0.4 : 0.35))
    setTimeout(function() { ctx.close() }, 500)
  } catch (e) { /* silent */ }
}

export default function PoemSort() {
  var poems = useStore(function(s) { return s.poems })
  var navigate = useNavigate()
  var filtered = poems.filter(function(p) { return (p.type === '诗' || p.type === '词') && p.content.length >= 2 && p.content.length <= 8 && p.content.join('').length <= 40 })

  var [pool, setPool] = useState<Segment[]>([])
  var [slots, setSlots] = useState<(Segment | null)[][]>([])
  var [draggedSeg, setDraggedSeg] = useState<Segment | null>(null)
  var [draggedFrom, setDraggedFrom] = useState<{ type: 'pool' | 'slot'; lineIdx?: number; slotIdx?: number } | null>(null)
  var [selectedSeg, setSelectedSeg] = useState<Segment | null>(null)
  var [result, setResult] = useState<'success' | 'error' | null>(null)
  var [showConfetti, setShowConfetti] = useState(false)
  var [currentPoem, setCurrentPoem] = useState<any>(null)
  var [startTime, setStartTime] = useState(0)
  var [elapsed, setElapsed] = useState(0)
  var [attempts, setAttempts] = useState(0)
  var [stats, setStats] = useState({ total: 0, success: 0 })
  var [showHistory, setShowHistory] = useState(false)
  var [historyRecords, setHistoryRecords] = useState<any[]>([])
  var [historyPage, setHistoryPage] = useState(0)
  var [historyTotal, setHistoryTotal] = useState(0)
  var HISTORY_PAGE_SIZE = 10
  var [showRecords, setShowRecords] = useState(false)
  var idCounter = useRef(0)

  function shuffle<T>(array: T[]): T[] {
    var a = [...array]
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function splitByPunctuation(str: string): string[] {
    if (!str) return []
    return str.split(/[，。！？；、]/).filter(Boolean)
  }

  function initGame() {
    if (filtered.length === 0) return
    var p = filtered[Math.floor(Math.random() * filtered.length)]
    setCurrentPoem(p)

    var lineCount = Math.min(p.content.length, 6)
    var lines = p.content.slice(0, lineCount)
    var allSegs: Segment[] = []
    var lineSegs: Segment[][] = []

    idCounter.current = 0

    for (var i = 0; i < lines.length; i++) {
      var texts = splitByPunctuation(lines[i])
      var segs = texts.map(function(text) {
        return { id: 'seg-' + idCounter.current++, text: text, lineIdx: i }
      })
      lineSegs.push(segs)
      allSegs.push(...segs)
    }

    setPool(shuffle(allSegs))
    setSlots(lineSegs.map(function(segs) { return segs.map(function() { return null }) }))
    setResult(null)
    setShowConfetti(false)
    setDraggedSeg(null)
    setDraggedFrom(null)
    setSelectedSeg(null)
    setAttempts(0)
    setStartTime(Date.now())
    setElapsed(0)
  }

  useEffect(function() { initGame() }, [poems])
  useEffect(function() {
    db.sortRecords.orderBy('createdAt').reverse().limit(100).toArray().then(function(rows) {
      setStats({ total: rows.length, success: rows.filter(function(r) { return r.success }).length })
    })
  }, [])
  useEffect(function() {
    if (result === 'success' || startTime === 0) return
    var id = setInterval(function() { setElapsed(Math.floor((Date.now() - startTime) / 1000)) }, 1000)
    return function() { clearInterval(id) }
  }, [result, startTime])

  function handleDragStart(seg: Segment, from: { type: 'pool' | 'slot'; lineIdx?: number; slotIdx?: number }) {
    setDraggedSeg(seg)
    setDraggedFrom(from)
  }

  function handleDrop(lineIdx: number, slotIdx: number) {
    if (!draggedSeg) return
    var newSlots = slots.map(function(line) { return [...line] })
    var existing = newSlots[lineIdx][slotIdx]

    newSlots[lineIdx][slotIdx] = draggedSeg

    if (existing) {
      if (draggedFrom?.type === 'pool') {
        setPool(function(prev) { return [...prev, existing!] })
      } else if (draggedFrom?.type === 'slot' && draggedFrom.lineIdx !== undefined && draggedFrom.slotIdx !== undefined) {
        newSlots[draggedFrom.lineIdx][draggedFrom.slotIdx] = existing
      }
    } else if (draggedFrom?.type === 'pool' && draggedSeg) {
      setPool(function(prev) { return prev.filter(function(s) { return s.id !== draggedSeg!.id }) })
    }

    setSlots(newSlots)
    setDraggedSeg(null)
    setDraggedFrom(null)
  }

  function handleSelectSegment(seg: Segment) {
    setSelectedSeg(function(prev) { return prev?.id === seg.id ? null : seg })
  }

  function handleClickSlot(lineIdx: number, slotIdx: number) {
    var existing = slots[lineIdx]?.[slotIdx]
    if (existing) {
      var newSlots = slots.map(function(line) { return [...line] })
      newSlots[lineIdx][slotIdx] = null
      setSlots(newSlots)
      setPool(function(prev) { return [...prev, existing!] })
      return
    }
    if (!selectedSeg) return
    var newSlots = slots.map(function(line) { return [...line] })
    newSlots[lineIdx][slotIdx] = selectedSeg
    setSlots(newSlots)
    setPool(function(prev) { return prev.filter(function(s) { return s.id !== selectedSeg!.id }) })
    setSelectedSeg(null)
  }

  function checkAnswer() {
    var correct = true
    for (var li = 0; li < slots.length; li++) {
      for (var si = 0; si < slots[li].length; si++) {
        var seg = slots[li][si]
        if (!seg || seg.lineIdx !== li) { correct = false; break }
      }
      if (!correct) break
    }
    if (correct) { setResult('success'); setShowConfetti(true); playTone(true); setTimeout(function() { setShowConfetti(false) }, 3000); setAttempts(0) }
    else { setResult('error'); setAttempts(function(p) { return p + 1 }); playTone(false) }
    if (currentPoem) {
      var totalSlots = slots.reduce(function(sum, line) { return sum + line.length }, 0)
      db.sortRecords.add({ poemTitle: currentPoem.title, poemAuthor: currentPoem.author, totalSlots: totalSlots, attempts: attempts + 1, success: correct, createdAt: new Date() })
      db.gameRecords.add({ game: '排序', poemTitle: currentPoem.title, poemAuthor: currentPoem.author, elapsed: elapsed, success: correct, createdAt: new Date() })
      db.sortRecords.orderBy('createdAt').reverse().limit(100).toArray().then(function(rows) {
        setStats({ total: rows.length, success: rows.filter(function(r) { return r.success }).length })
      })
    }
  }

  function getFilledCount(lineIdx: number) {
    return slots[lineIdx]?.filter(Boolean).length || 0
  }

  function openHistory() {
    db.sortRecords.orderBy('createdAt').reverse().offset(0).limit(HISTORY_PAGE_SIZE).toArray().then(function(rows) {
      setHistoryRecords(rows)
      setHistoryPage(0)
      db.sortRecords.count().then(function(c) { setHistoryTotal(c) })
      setShowHistory(true)
    })
  }

  function loadHistoryPage(page: number) {
    db.sortRecords.orderBy('createdAt').reverse().offset(page * HISTORY_PAGE_SIZE).limit(HISTORY_PAGE_SIZE).toArray().then(function(rows) {
      setHistoryRecords(rows)
      setHistoryPage(page)
    })
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={function() { navigate(-1) }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <span className="text-sm font-bold text-foreground/70">诗词排序</span>
        <div className="flex-1" />
      </div>

      <div className="flex flex-col max-w-4xl mx-auto w-full">
        {/* Poem Info */}
        {currentPoem && (
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-primary">{currentPoem.title}</h2>
            <p className="text-sm text-muted-foreground">{currentPoem.author} · {currentPoem.dynasty}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-3 text-center">根据记忆将片段拖入对应行</p>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              已完成 <span className="text-foreground font-medium">{stats.success}</span> / {stats.total} 首
            </div>
            <button onClick={openHistory} className="flex items-center gap-1 text-primary hover:underline">
              <Clock className="h-3 w-3" /> 历史记录
            </button>
            {startTime > 0 && <span className="text-muted-foreground ml-2">⏱ {elapsed}秒</span>}
          </div>
        )}

        {/* Slots */}
        <div className="space-y-2 mb-3">
          {slots.map(function(lineSlots, lineIdx) {
            var filled = getFilledCount(lineIdx)
            var total = lineSlots.length
            var allFilled = filled === total
            return (
              <div key={lineIdx}
                className={'p-2 lg:p-3 rounded-xl border-2 transition-all ' + (allFilled ? (result === 'success' ? 'border-green-400 bg-green-50' : result === 'error' ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50') : 'border-border bg-card')}>
                <div className="flex items-stretch gap-2 flex-wrap">
                  {lineSlots.map(function(slot, slotIdx) {
                    return (
                      <div key={slotIdx}
                        className={'flex-1 min-w-[80px] lg:min-w-[100px] h-10 lg:h-11 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all cursor-pointer ' + (slot
                          ? 'border-solid bg-blue-50 border-blue-400 text-blue-700 px-2'
                          : selectedSeg ? 'border-dashed border-blue-400 bg-blue-50/50' : 'border-dashed border-slate-300 bg-muted')}
                        onDragOver={function(e) { e.preventDefault(); if (!slot) { (e.currentTarget as HTMLElement).classList.add('border-blue-500', 'bg-blue-100') } }}
                        onDragLeave={function(e) { if (!slot) { (e.currentTarget as HTMLElement).classList.remove('border-blue-500', 'bg-blue-100') } }}
                        onDrop={function(e) { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove('border-blue-500', 'bg-blue-100'); handleDrop(lineIdx, slotIdx) }}
                        onClick={function() { handleClickSlot(lineIdx, slotIdx) }}>
                        {slot ? (
                          <span draggable onDragStart={function() { handleDragStart(slot, { type: 'slot', lineIdx, slotIdx }) }}
                            onDragEnd={function() { setDraggedSeg(null); setDraggedFrom(null) }}
                            className="cursor-grab select-none truncate">{slot.text}</span>
                        ) : (
                          <span className="text-muted-foreground select-none">___</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pool */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1.5 text-center">
            可拖拽的片段 <span className="text-primary font-medium">({pool.length})</span>
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center min-h-[32px] p-1.5 bg-muted rounded-xl">
            {pool.map(function(seg) {
              return (
                <div key={seg.id}
                  className={'px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs lg:text-sm font-medium shadow-sm transition-all ' + (selectedSeg?.id === seg.id ? 'ring-3 ring-yellow-300 scale-105 cursor-pointer' : 'cursor-grab active:cursor-grabbing hover:shadow-md') + (draggedSeg?.id === seg.id ? ' opacity-50 scale-95' : '')}
                  draggable onDragStart={function() { handleDragStart(seg, { type: 'pool' }) }}
                  onDragEnd={function() { setDraggedSeg(null); setDraggedFrom(null) }}
                  onClick={function() { handleSelectSegment(seg) }}>
                  {seg.text}
                </div>
              )
            })}
            {pool.length === 0 && <p className="text-xs text-muted-foreground py-1">全部已填入</p>}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={'px-4 py-2 text-center font-semibold rounded-lg mb-4 ' + (result === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
            {result === 'success' ? '🎉 太棒了！回答正确！' : '❌ 有些片段位置不对哦，再试试吧！'}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={initGame}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RotateCcw className="h-3.5 w-3.5" /> 再来一次
          </button>
          <button onClick={initGame}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors card-hover">
            <RefreshCw className="h-3.5 w-3.5" /> 换一首
          </button>
          {result !== 'success' && (
            <button onClick={checkAnswer} disabled={pool.length > 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed card-hover">
              检查答案
            </button>
          )}
          <button onClick={function() { setShowRecords(true) }}
            className="flex items-center gap-1 px-3 py-2 rounded-full bg-muted/50 text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">
            🏆 记录
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">💡 拖拽片段到横线处，或点击选中后点击横线放置</p>
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}
      <RecordsModal game="排序" open={showRecords} onClose={function() { setShowRecords(false) }} />

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={function() { setShowHistory(false) }}>
          <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-y-auto" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
              <h3 className="font-medium text-sm">排序记录</h3>
              <button onClick={function() { setShowHistory(false) }} className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer">&times;</button>
            </div>
            <div className="p-4 space-y-2">
              {historyRecords.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">暂无记录</p>}
              {historyRecords.map(function(r, i) {
                return (
                  <div key={r.id || i} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                    <div className={'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ' + (r.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                      {r.success ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{r.poemTitle}</div>
                      <div className="text-xs text-muted-foreground">{r.poemAuthor} · {r.totalSlots}段{r.attempts > 1 ? ' · 尝试' + r.attempts + '次' : ''}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                )
              })}
            </div>
            {historyTotal > HISTORY_PAGE_SIZE && (
              <div className="flex items-center justify-center gap-2 p-3 border-t sticky bottom-0 bg-background">
                <button onClick={function() { loadHistoryPage(historyPage - 1) }} disabled={historyPage === 0}
                  className="px-3 py-1 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-muted transition-colors cursor-pointer">上一页</button>
                <span className="text-xs text-muted-foreground">第{historyPage + 1}/{'共' + Math.ceil(historyTotal / HISTORY_PAGE_SIZE) + '页'}</span>
                <button onClick={function() { loadHistoryPage(historyPage + 1) }} disabled={(historyPage + 1) * HISTORY_PAGE_SIZE >= historyTotal}
                  className="px-3 py-1 rounded-lg border text-xs font-medium disabled:opacity-30 hover:bg-muted transition-colors cursor-pointer">下一页</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Confetti() {
  var [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([])

  useEffect(function() {
    var colors = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c']
    var items = Array.from({ length: 50 }, function(_, i) {
      return { id: i, x: Math.random() * 100, color: colors[Math.floor(Math.random() * colors.length)], delay: Math.random() * 500, size: Math.random() * 8 + 4 }
    })
    setParticles(items)
    var timer = setTimeout(function() { setParticles([]) }, 3500)
    return function() { clearTimeout(timer) }
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(function(p) {
        return <div key={p.id} className="absolute animate-bounce" style={{
          left: p.x + '%', top: '-20px', width: p.size, height: p.size,
          backgroundColor: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animationDuration: (2 + Math.random()) + 's',
          animationDelay: p.delay + 'ms', opacity: 0,
        }} />
      })}
    </div>
  )
}
