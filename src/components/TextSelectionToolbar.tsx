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

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setTimeout(() => {
          if (!toolbarRef.current?.contains(document.activeElement)) {
            setSelection(null)
            setCharInfo(null)
          }
        }, 200)
        return
      }

      const text = sel.toString().trim()
      if (text.length > 50) return

      const range = sel.getRangeAt(0)
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
      window.speechSynthesis.speak(u)
    }
  }

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

  if (!selection) return null

  return (
    <>
      <div
        ref={toolbarRef}
        className="fixed z-50 flex items-center gap-1 bg-gray-900 rounded-xl shadow-lg px-2 py-1.5"
        style={{
          left: Math.max(8, Math.min(selection.x - 80, window.innerWidth - 170)),
          top: Math.max(8, selection.y - 44),
        }}
      >
        <button
          onClick={() => { speak(selection.text); setSelection(null) }}
          className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
          title="朗读"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <button
          onClick={async () => { await navigator.clipboard.writeText(selection.text); setSelection(null) }}
          className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
          title="复制"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={showCharInfo}
          className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
          title="拼音/字义"
        >
          <BookText className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setSelectedText(selection.text)
            useSelectionStore.getState().setAiPrompt(selection.text)
            setSelection(null)
          }}
          className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
          title="AI分析"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      {charInfo && (
        <div className="fixed bottom-24 right-4 z-50 bg-background rounded-xl shadow-xl border p-4 min-w-[220px] max-w-[320px] space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
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
            <button onClick={() => setCharInfo(null)} className="text-muted-foreground hover:text-foreground">&times;</button>
          </div>

          {'radical' in charInfo && charInfo.radical && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Grid3X3 className="h-3 w-3" /> 部首：<span className="text-foreground font-medium">{charInfo.radical}</span>
            </div>
          )}

          {'explain' in charInfo && charInfo.explain && (
            <div className="text-xs text-muted-foreground leading-relaxed">
              <BookOpen className="h-3 w-3 inline mr-1" /> {charInfo.explain}
            </div>
          )}

          {'words' in charInfo && charInfo.words && charInfo.words.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">常用词语：</div>
              <div className="flex flex-wrap gap-1">
                {charInfo.words.map(function(w, i) {
                  return <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{w}</span>
                })}
              </div>
            </div>
          )}

          {charInfo.char.length > 1 && (
            <div className="text-xs text-muted-foreground">{charInfo.pinyin}</div>
          )}
        </div>
      )}
    </>
  )
}
