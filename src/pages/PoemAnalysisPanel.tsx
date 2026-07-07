import { useState, useCallback, useRef } from 'react'
import { BookOpen } from 'lucide-react'

interface RhymeGroup {
  final: string
  lines: number[]
}

interface ParallelismResult {
  line1: number
  line2: number
  text1: string
  text2: string
  isParallel: boolean
  details: string
}

function getFinal(pinyin: string): string {
  var trimmed = pinyin.trim().toLowerCase()
  var match = trimmed.match(/([aeiouüê]+o?u?n?g?ng?r?m?n?)$/)
  if (!match) return trimmed
  var final = match[1]
  if (final.endsWith('ng') && final.length > 2) return final.slice(-3)
  if (final.endsWith('n') && final.length > 2) return final.slice(-2)
  return final
}

function extractRhymeKey(pinyin: string): string {
  var final = getFinal(pinyin)
  if (final.endsWith('i')) return 'i'
  if (final.endsWith('u') || final.endsWith('ü') || final.endsWith('ou') || final.endsWith('iu')) return 'u'
  if (final.endsWith('an') || final.endsWith('en') || final.endsWith('in') || final.endsWith('un') || final.endsWith('ün') || final.endsWith('ian') || final.endsWith('uan') || final.endsWith('ian') || final.endsWith('van')) return 'an'
  if (final.endsWith('ang') || final.endsWith('eng') || final.endsWith('ing') || final.endsWith('ong')) return 'ang'
  if (final.endsWith('ao') || final.endsWith('iao')) return 'ao'
  if (final.endsWith('ai')) return 'ai'
  if (final.endsWith('ei') || final.endsWith('ui')) return 'ei'
  return final
}

export default function PoemAnalysisPanel() {
  var [text, setText] = useState('')
  var [loading, setLoading] = useState(false)
  var [rhymeGroups, setRhymeGroups] = useState<RhymeGroup[]>([])
  var [parallelism, setParallelism] = useState<ParallelismResult[]>([])
  var [hasResult, setHasResult] = useState(false)
  var textareaRef = useRef<HTMLTextAreaElement>(null)

  var analyze = useCallback(async function() {
    var t = (textareaRef.current?.value || '').trim()
    if (!t) return
    setText(t)
    setLoading(true)
    setRhymeGroups([])
    setParallelism([])
    setHasResult(false)
    try {
      var pinyinPro = await import('pinyin-pro')
      var lines = text.trim().split('\n').filter(function(l) { return l.trim().length > 0 })

      var linePinyinLast: string[] = []
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim()
        var chars = line.replace(/[\u3002\uff0c\uff01\uff1f\u3001\u300a\u300b\uff08\uff09]/g, '')
        var lastChar = chars[chars.length - 1]
        if (lastChar) {
          var py = pinyinPro.pinyin(lastChar, { pattern: 'pinyin', toneType: 'symbol' })
          var pyStr = Array.isArray(py) ? String(py) : String(py)
          linePinyinLast.push(pyStr)
        } else {
          linePinyinLast.push('')
        }
      }

      var groups: Record<string, number[]> = {}
      for (var i = 0; i < linePinyinLast.length; i++) {
        var py = linePinyinLast[i]
        if (!py) continue
        var key = extractRhymeKey(py)
        if (!groups[key]) groups[key] = []
        groups[key].push(i + 1)
      }
      var result: RhymeGroup[] = []
      for (var key in groups) {
        if (groups[key].length >= 2) {
          result.push({ final: key, lines: groups[key] })
        }
      }
      setRhymeGroups(result)

      var paraResults: ParallelismResult[] = []
      for (var i = 0; i < lines.length - 1; i++) {
        var line1 = lines[i].trim().replace(/[\u3002\uff0c\uff01\uff1f\u3001\u300a\u300b\uff08\uff09]/g, '')
        var line2 = lines[i + 1].trim().replace(/[\u3002\uff0c\uff01\uff1f\u3001\u300a\u300b\uff08\uff09]/g, '')
        if (line1.length !== line2.length || line1.length < 2) {
          paraResults.push({
            line1: i + 1, line2: i + 2, text1: line1, text2: line2,
            isParallel: false, details: '字数不同，非对仗',
          })
          continue
        }
        var tones1: string[] = []
        var tones2: string[] = []
        for (var j = 0; j < line1.length; j++) {
          var py1 = pinyinPro.pinyin(line1[j], { pattern: 'pinyin', toneType: 'symbol' })
          var py2 = pinyinPro.pinyin(line2[j], { pattern: 'pinyin', toneType: 'symbol' })
          var s1 = Array.isArray(py1) ? String(py1) : String(py1)
          var s2 = Array.isArray(py2) ? String(py2) : String(py2)
          tones1.push(s1)
          tones2.push(s2)
        }
        var toneMatch = 0
        for (var j = 0; j < tones1.length; j++) {
          var t1 = tones1[j].match(/[1-4]/) ? tones1[j].match(/[1-4]/)![0] : '0'
          var t2 = tones2[j].match(/[1-4]/) ? tones2[j].match(/[1-4]/)![0] : '0'
          if (t1 !== t2) toneMatch++
        }
        var isPara = toneMatch >= Math.floor(line1.length * 0.6)
        var details = toneMatch + '/' + line1.length + ' 字平仄相对'
        paraResults.push({
          line1: i + 1, line2: i + 2, text1: line1, text2: line2,
          isParallel: isPara, details: details,
        })
      }
      setParallelism(paraResults)
      setHasResult(true)
    } catch {
      setHasResult(false)
    } finally {
      setLoading(false)
    }
  }, [text])

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        分析古诗的韵脚（押韵）和对仗（对偶）规律。文字限制 1000 字以内。
      </div>

      <div>
        <textarea ref={textareaRef}
          placeholder={"输入古诗...\n\n示例：\n白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼"}
          className="min-h-[160px] w-full resize-y rounded-xl border border-input bg-background p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="mt-1 text-right text-xs text-muted-foreground">{text.length}/1000</div>
      </div>

      <button onClick={analyze} disabled={loading || !text.trim()}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
        {loading ? '分析中...' : '分析'}
      </button>

      {hasResult && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">韵脚分析</span>
            </div>
            {rhymeGroups.length === 0 ? (
              <div className="text-xs text-muted-foreground">未检测到押韵规律</div>
            ) : (
              <div className="space-y-2">
                {rhymeGroups.map(function(g, i) {
                  return (
                    <div key={i} className="rounded-xl bg-muted/50 px-4 py-3 text-xs leading-relaxed">
                      <span className="font-medium text-foreground">韵母「{g.final}」</span>
                      <span className="text-muted-foreground ml-2">
                        第 {g.lines.join('、')} 句押韵
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">对仗分析</span>
            </div>
            <div className="space-y-2">
              {parallelism.map(function(p, i) {
                return (
                  <div key={i} className={'rounded-xl px-4 py-3 text-xs leading-relaxed ' + (p.isParallel
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-muted/50')}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-muted-foreground">第{p.line1}句</span>
                      <span className="text-foreground font-medium">{p.text1}</span>
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-muted-foreground">第{p.line2}句</span>
                      <span className="text-foreground font-medium">{p.text2}</span>
                    </div>
                    <div className={p.isParallel ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                      {p.isParallel ? '✓ ' : ''}{p.details}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
