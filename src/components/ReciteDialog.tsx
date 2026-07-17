import { X, Check, Volume2 } from 'lucide-react'
import PoemContent from './PoemContent'

export default function ReciteDialog({ poem, onResult, onClose }: { poem: any, onResult: (remembered: boolean) => void, onClose: () => void }) {
  if (!poem) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={function() { onClose() }}>
      <div className="bg-background rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto" onClick={function(e) { e.stopPropagation() }}>
        <div className="p-4 lg:p-5 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <button onClick={function() { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(poem.content.join('，')); u.lang = 'zh-CN'; u.rate = 0.85; window.speechSynthesis.speak(u) } }} className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium cursor-pointer shrink-0">
              <Volume2 className="h-3.5 w-3.5 text-primary" /> 朗读
            </button>
            <div className="flex-1 text-center text-sm">
              <span className="font-bold font-poem">{poem.title}</span>
              <span className="text-muted-foreground ml-2">{poem.dynasty} · {poem.author}</span>
            </div>
            <button onClick={function() { onClose() }} className="text-sm text-muted-foreground cursor-pointer shrink-0">&times; 关闭</button>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-6">
            <PoemContent content={poem.content} onModeChange={function(){}} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={function() { onResult(false) }} className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-3 text-sm text-red-600 font-medium cursor-pointer">
              <X className="h-4 w-4 inline mr-1" /> 忘记了
            </button>
            <button onClick={function() { onResult(true) }} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 py-3 text-sm text-emerald-600 font-medium cursor-pointer">
              <Check className="h-4 w-4 inline mr-1" /> 记住了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
