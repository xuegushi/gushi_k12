import { Volume2, X, Check } from 'lucide-react'
import PoemContent from './PoemContent'

interface DialogProps {
  poem: { title: string; author: string; dynasty: string; content: string[] }
  open: boolean
  onClose: () => void
  onRemember: () => void
  onForget: () => void
}

export default function StudyReciteDialog({ poem, open, onClose, onRemember, onForget }: DialogProps) {
  if (!open) return null

  var speak = function(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      var u = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''))
      u.lang = 'zh-CN'; u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4 lg:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm text-muted-foreground cursor-pointer">&times; 关闭</button>
            <div className="flex-1" />
            <button onClick={function() { speak(poem.content.join('，')) }} className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium cursor-pointer">
              <Volume2 className="h-3.5 w-3.5 text-primary" /> 朗读
            </button>
          </div>
          <div className="text-center py-2 border-b">
            <h2 className="text-lg font-bold font-poem">{poem.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{poem.dynasty} · {poem.author}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4">
            <PoemContent content={poem.content} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onForget}
              className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3 text-sm text-red-600 font-medium cursor-pointer">
              <X className="h-4 w-4 inline mr-1" /> 忘记了
            </button>
            <button onClick={onRemember}
              className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-3 text-sm text-emerald-600 font-medium cursor-pointer">
              <Check className="h-4 w-4 inline mr-1" /> 记住了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
