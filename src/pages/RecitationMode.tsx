import { useState, useRef, useCallback } from 'react'
import { Play, Pause, Check } from 'lucide-react'

export default function RecitationMode({
  open,
  onClose,
  content,
}: {
  open: boolean
  onClose: () => void
  content: string[]
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const handleToggle = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      startTimeRef.current = Date.now() - elapsed * 1000
      setIsRunning(true)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
  }, [isRunning, elapsed])

  const handleComplete = () => {
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    onClose()
  }

  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">背诵模式</h2>
            <span className="text-lg font-mono tabular-nums">
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="rounded-xl bg-gray-50 p-6">
            {content.map((line, i) => (
              <p key={i} className="text-center text-base leading-8">{line}</p>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleToggle}
              className="flex items-center justify-center gap-1.5 rounded-xl border py-3 text-sm cursor-pointer"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? '暂停' : '开始'}
            </button>
            <button
              onClick={handleComplete}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white py-3 text-sm cursor-pointer"
            >
              <Check className="h-4 w-4" />
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
