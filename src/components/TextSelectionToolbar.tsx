import { useState, useRef, useEffect } from 'react'
import { Volume2, Sparkles, Copy, BookText, Hash, Grid3X3, BookOpen } from 'lucide-react'
import { useSelectionStore } from '../store/selection'
import { getCharInfo, getPhrasePinyin, type CharDetail } from '../lib/character'

interface SelectionState {
  text: string
  x: number
  y: number
}

export default function TextSelectionToolbar() {
  const setSelectedText = useSelectionStore(s => s.setSelectedText)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [charInfo, setCharInfo] = useState<CharDetail | { char: string; pinyin: string } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const strokeCanvasRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<any>(null)

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        // Don't dismiss if click is inside toolbar or popup
        if (toolbarRef.current?.contains(e.target as Node) || popupRef.current?.contains(e.target as Node)) return
        setTimeout(() => {
          if (!toolbarRef.current?.contains(document.activeElement) && !popupRef.current?.contains(document.activeElement)) {
            setSelection(null)
            setCharInfo(null)
          }
        }, 200)
        return
      }

      const text = sel.toString().trim()
      if (text.length > 50) return

      // Ignore selections inside the popup
      const range = sel.getRangeAt(0)
      if (popupRef.current?.contains(range.commonAncestorContainer as Node)) return

      const rect = range.getBoundingClientRect()
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
      setCharInfo(null)
    }

    const handleScroll = function() { setSelection(null); setCharInfo(null) }
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('scroll', handleScroll)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  // Initialize hanzi-writer for stroke animation
  useEffect(function() {
    if (!charInfo || charInfo.char.length !== 1 || !strokeCanvasRef.current) return
    var cancelled = false
    strokeCanvasRef.current.innerHTML = ''
    ;(async function() {
      var HanziWriter = (await import('hanzi-writer')).default
      if (cancelled) return
      var writer = HanziWriter.create(strokeCanvasRef.current!, charInfo.char, {
        width: 120, height: 120, padding: 5,
        strokeColor: '#333', radicalColor: '#e74c3c',
        showOutline: true, showCharacter: false,
        delayBetweenStrokes: 300, delayBetweenLoops: 2000,
      })
      writerRef.current = writer
    })()
    return function() { cancelled = true; writerRef.current = null }
  }, [charInfo])

  const showCharInfo = () => {
    if (!selection) return
    const text = selection.text
    if (text.length === 1) {
      const info = getCharInfo(text)
      if (info) setCharInfo(info)
    } else {
      const pinyin = getPhrasePinyin(text)
      setCharInfo({
        char: text,
        pinyin: pinyin.join(' '),
      })
    }
  }

  return (
    <>
      {selection && (
        <div
          ref={toolbarRef}
          className="fixed z-50 flex items-center gap-1 bg-gray-900 rounded-xl shadow-lg px-2 py-1.5 whitespace-nowrap"
          style={{
            left: Math.max(8, Math.min(selection.x - 80, window.innerWidth - 170)),
            top: Math.max(8, selection.y - 44),
          }}
        >
        <button
          onClick={() => { speak(selection.text); setSelection(null) }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/20 transition-colors text-xs cursor-pointer"
          title="朗读"
        >
          <Volume2 className="h-3.5 w-3.5" /> 朗读
        </button>
        <button
          onClick={async () => { await navigator.clipboard.writeText(selection.text); setSelection(null) }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/20 transition-colors text-xs cursor-pointer"
          title="复制"
        >
          <Copy className="h-3.5 w-3.5" /> 复制
        </button>
        <button
          onClick={showCharInfo}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/20 transition-colors text-xs cursor-pointer"
          title="拼音/字义"
        >
          <BookText className="h-3.5 w-3.5" /> 字典
        </button>
        <button
          onClick={() => {
            setSelectedText(selection.text)
            useSelectionStore.getState().setAiPrompt(selection.text)
            setSelection(null)
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white hover:bg-white/20 transition-colors text-xs cursor-pointer"
          title="AI分析"
        >
          <Sparkles className="h-3.5 w-3.5" /> AI
        </button>
        </div>
      )}

      {charInfo && (
        <div ref={popupRef} className="fixed bottom-24 right-4 z-50 bg-background/95 backdrop-blur-md rounded-xl shadow-2xl border border-primary/10 p-4 min-w-[280px] max-w-[360px] space-y-3">
          <div className="flex items-start gap-3">
            {charInfo.char.length === 1 && 'strokeCount' in charInfo ? (
              <>
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div ref={strokeCanvasRef}
                    className="flex items-center justify-center rounded-xl border-2 border-border bg-white dark:bg-neutral-900"
                    style={{ width: 120, height: 120 }} />
                  <button onClick={function() { writerRef.current?.animateCharacter?.() }}
                    className="w-full rounded-lg bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 hover:bg-primary/20 transition-colors cursor-pointer">
                    开始动画
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">{charInfo.char}</div>
                      <span className="text-sm text-primary font-medium">{charInfo.pinyin}</span>
                      {charInfo.strokeCount > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Hash className="h-3 w-3" /> {charInfo.strokeCount}画
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setCharInfo(null); writerRef.current = null }}
                      className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer">&times;</button>
                  </div>
                  {'radical' in charInfo && charInfo.radical && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Grid3X3 className="h-3 w-3 shrink-0" /> 部首：<span className="text-foreground font-medium">{charInfo.radical}</span>
                    </div>
                  )}
                  {'explain' in charInfo && charInfo.explain && (
                    <div className="text-xs text-muted-foreground leading-relaxed mt-2">
                      <BookOpen className="h-3 w-3 inline mr-1 shrink-0" /> {charInfo.explain}
                    </div>
                  )}
                  {'words' in charInfo && charInfo.words && charInfo.words.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">常用词语：</div>
                      <div className="flex flex-wrap gap-1">
                        {charInfo.words.map(function(w, i) {
                          return <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{w}</span>
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl font-bold font-poem">{charInfo.char}</span>
                  <div>
                    <span className="text-sm text-primary font-medium">{charInfo.pinyin}</span>
                    {'strokeCount' in charInfo && charInfo.strokeCount > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Hash className="h-3 w-3" /> {charInfo.strokeCount}画
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setCharInfo(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer">&times;</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
