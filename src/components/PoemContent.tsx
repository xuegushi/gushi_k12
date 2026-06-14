import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Mode = 'show' | 'hide' | 'first' | 'last' | 'random'

var el: HTMLTextAreaElement | null = null
function decodeHtml(text: string): string {
  if (typeof document === 'undefined') return text
  if (!el) { el = document.createElement('textarea') }
  el.innerHTML = text
  return el.value
}

function isChinese(ch: string): boolean {
  return /[\u4e00-\u9fa5]/.test(ch)
}

function splitChars(line: string): Array<{ ch: string; cn: boolean }> {
  var parts: Array<{ ch: string; cn: boolean }> = []
  var decoded = decodeHtml(line)
  for (var c of decoded) {
    if (c.trim() === '') continue
    parts.push({ ch: c, cn: isChinese(c) })
  }
  return parts
}

function CharBox({ ch, cn, hidden }: { ch: string; cn: boolean; hidden: boolean }) {
  if (!cn) return <span className="text-lg lg:text-xl">{ch}</span>
  return (
    <span className={'inline-flex items-center justify-center w-7 h-8 lg:w-8 lg:h-9 rounded-sm text-lg lg:text-xl font-poem ' + (hidden
      ? 'border border-dashed border-muted-foreground/30 text-transparent select-none'
      : 'border border-border')}>
      {hidden ? '口' : ch}
    </span>
  )
}

function PoemLine({ text, mode }: { text: string; mode: Mode }) {
  var parts = splitChars(text)
  var cnParts = parts.filter(function(p) { return p.cn })
  var count = cnParts.length

  var rendered = parts.map(function(p) {
    if (!p.cn) return { ch: p.ch, cn: false, hidden: false }
    if (mode === 'show') return { ch: p.ch, cn: true, hidden: false }
    if (mode === 'hide') return { ch: p.ch, cn: true, hidden: true }
    if (mode === 'first') return { ch: p.ch, cn: true, hidden: p !== cnParts[0] }
    if (mode === 'last') return { ch: p.ch, cn: true, hidden: p !== cnParts[count - 1] }
    if (mode === 'random') return { ch: p.ch, cn: true, hidden: p !== cnParts[Math.floor(Math.random() * count)] }
    return { ch: p.ch, cn: true, hidden: false }
  })

  return (
    <p className={'text-lg lg:text-xl leading-loose flex flex-wrap gap-x-1 justify-center'}>
      {rendered.map(function(p, i) {
        return <CharBox key={i} ch={p.ch} cn={p.cn} hidden={p.hidden} />
      })}
    </p>
  )
}

const MODES: Mode[] = ['show', 'hide', 'first', 'last', 'random']

interface PoemContentProps {
  content: string[]
  onModeChange?: (m: Mode) => void
}

export default function PoemContent({ content, onModeChange }: PoemContentProps) {
  var [mode, setMode] = useState<Mode>('hide')

  var handleMode = function(m: Mode) {
    setMode(m)
    if (onModeChange) onModeChange(m)
  }

  if (!content || content.length === 0) return null

  return (
    <div className="space-y-3">
      {onModeChange && (
        <div className="flex items-center justify-center gap-2">
          {MODES.map(function(m) {
            return (
              <button key={m} onClick={function() { handleMode(m) }}
                className={'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border transition-colors ' + (mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:text-foreground')}>
                {m === 'show' && <Eye className="h-3 w-3" />}
                {m === 'hide' && <EyeOff className="h-3 w-3" />}
                {m === 'show' && <span>显示</span>}
                {m === 'hide' && <span>全隐</span>}
                {m === 'first' && <span>首字</span>}
                {m === 'last' && <span>末字</span>}
                {m === 'random' && <span>随机</span>}
              </button>
            )
          })}
        </div>
      )}
      <div className="space-y-1 text-center">
        {content.map(function(line, i) {
          return <PoemLine key={i} text={line} mode={mode} />
        })}
      </div>
    </div>
  )
}

export type { Mode }
