import { Volume2, Check, X } from 'lucide-react'
import PoemContent from './PoemContent'

interface Poem {
  title: string
  author: string
  dynasty: string
  content: string[]
}

interface RecitationDialogProps {
  poem: Poem
  open: boolean
  onClose: () => void
  onResult?: (remembered: boolean) => void
}

export default function RecitationDialog({ poem, open, onClose, onResult }: RecitationDialogProps) {
  var speak = function(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      var u = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''))
      u.lang = 'zh-CN'
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={function(e) { e.stopPropagation() }}>
        <div className="p-4 lg:p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm text-muted-foreground cursor-pointer">&times; 关闭</button>
            <div className="flex-1" />
            <button onClick={function() { speak(poem.content.join('，')) }} className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium cursor-pointer">
              <Volume2 className="h-3.5 w-3.5 text-primary" /> 朗读
            </button>
          </div>

          {/* Title */}
          <div className="text-center py-2 border-b">
            <h2 className="text-lg font-bold font-poem">{poem.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{poem.dynasty} · {poem.author}</p>
          </div>

          {/* Poem content with blanking */}
          <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4">
            <PoemContent content={poem.content} />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={function() { if (onResult) onResult(false); onClose() }}
              className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3 text-sm text-red-600 font-medium cursor-pointer">
              <X className="h-4 w-4 inline mr-1" /> 忘记了
            </button>
            <button onClick={function() { if (onResult) onResult(true); onClose() }}
              className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-3 text-sm text-emerald-600 font-medium cursor-pointer">
              <Check className="h-4 w-4 inline mr-1" /> 记住了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
