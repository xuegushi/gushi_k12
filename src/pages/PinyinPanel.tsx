import { useState, useCallback, useRef } from 'react'

function isChinese(char: string): boolean {
  const code = char.charCodeAt(0)
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)
}

function toPlainText(rubyText: string): string {
  return rubyText.replace(/<[^>]+>/g, '')
}

export default function PinyinPanel() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAnnotate = useCallback(async () => {
    const text = (textareaRef.current?.value || '').trim()
    if (!text) return
    setInput(text)
    setLoading(true)
    try {
      const pinyinPro = await import('pinyin-pro')
      const chars = text.split('')
      const html = chars.map(char => {
        if (!isChinese(char)) return char
        try {
          const py = pinyinPro.pinyin(char, { toneType: 'symbol', type: 'array' })
          const pinyin = Array.isArray(py) ? py[0] : py
          return `<ruby>${char}<rp>(</rp><rt>${pinyin}</rt><rp>)</rp></ruby>`
        } catch {
          return char
        }
      }).join('')
      setResult(html)
    } catch (e) {
      console.error('Pinyin error:', e)
    }
    setLoading(false)
  }, [input])

  const handleCopy = useCallback(async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(toPlainText(result))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Copy failed')
    }
  }, [result])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">输入中文文本</label>
        <textarea
          ref={textareaRef}
          className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入诗词或文言文，点击按钮标注拼音..."
        />
        <div className="text-right text-sm text-muted-foreground mt-1">{input.length}/2000</div>
      </div>

      <button
        onClick={handleAnnotate}
        disabled={loading || !input.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '标注中...' : '标注拼音'}
      </button>

      {result && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">标注结果</h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div
            className="p-4 bg-muted/50 rounded-xl leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: result }}
          />
          <div className="mt-2 p-3 bg-muted/50 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">纯文本版本</div>
            <div className="text-sm">{toPlainText(result)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
