import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../store'
import { chat } from '../lib/ai'
import { db } from '../lib/db'
import { Wrench, Languages, Volume2, PenTool, Droplets, Puzzle, Edit3, Cherry, LayoutGrid, Grid3X3, Trophy } from 'lucide-react'

type Tab = 'translate' | 'tts' | 'handwriting'

const TABS: { key: Tab; label: string; icon: typeof Wrench }[] = [
  { key: 'translate', label: '文言文翻译', icon: Languages },
  { key: 'tts', label: '文本朗读', icon: Volume2 },
  { key: 'handwriting', label: '字迹演练', icon: PenTool },
]

export default function Tools() {
  var [searchParams, setSearchParams] = useSearchParams()
  var tabFromQuery = searchParams.get('tab') as Tab | null
  var [activeTab, setActiveTab] = useState<Tab>(function() {
    if (tabFromQuery && ['translate', 'tts', 'handwriting'].includes(tabFromQuery)) return tabFromQuery
    return 'translate'
  })

  var switchTab = function(tab: Tab) {
    setActiveTab(tab)
    setSearchParams({ tab: tab }, { replace: true })
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 mb-1">
        <Wrench className="h-5 w-5 text-primary" />
        <h1 className="text-xl lg:text-2xl font-bold">工具箱</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">文言文翻译 · 文本朗读 · 字迹演练</p>

      <div className="flex gap-6">
        <nav className="hidden md:flex w-44 shrink-0 flex-col gap-1 rounded-xl bg-muted/40 p-2">
          {TABS.map(function(tab) {
            var active = activeTab === tab.key
            return (
              <button key={tab.key} onClick={function() { switchTab(tab.key) }}
                className={'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ' + (active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0">
          <div className="mb-6 flex md:hidden gap-1 rounded-xl bg-muted p-1">
            {TABS.map(function(tab) {
              var active = activeTab === tab.key
              return (
                <button key={tab.key} onClick={function() { switchTab(tab.key) }}
                  className={'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ' + (active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground')}>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'translate' && <TranslatePanel />}
          {activeTab === 'tts' && <TTSPanel />}
          {activeTab === 'handwriting' && <HandwritingPanel />}
        </div>
      </div>

      {/* 趣味链接 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">趣味</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/poem-rain" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">诗词雨</p>
              <p className="text-xs text-muted-foreground">黑客帝国风格的诗词矩阵雨</p>
            </div>
          </Link>
          <Link to="/poem-sort" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Puzzle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">诗词排序</p>
              <p className="text-xs text-muted-foreground">拖拽片段还原诗句顺序</p>
            </div>
          </Link>
          <Link to="/poem-fill" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">诗词填空</p>
              <p className="text-xs text-muted-foreground">选字填入诗句空白处</p>
            </div>
          </Link>
          <Link to="/poem-chain" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600">
              <Cherry className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">飞花令</p>
              <p className="text-xs text-muted-foreground">说出包含指定字的诗句</p>
            </div>
          </Link>
          <Link to="/poem-match" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">诗词连连看</p>
              <p className="text-xs text-muted-foreground">翻转卡片匹配上下句</p>
            </div>
          </Link>
          <Link to="/poem-puzzle" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">诗词拼图</p>
              <p className="text-xs text-muted-foreground">交换字块还原诗句</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ==================== 翻译面板 ====================

var TRANSLATE_DIRECTIONS = [
  { value: 'classical_to_modern', label: '文言文 → 白话文' },
  { value: 'modern_to_classical', label: '白话文 → 文言文' },
] as const

interface TranslateRecord {
  id?: number
  text: string
  direction: string
  translated: string
  createdAt: Date
}

function TranslatePanel() {
  var [text, setText] = useState('')
  var [direction, setDirection] = useState('classical_to_modern')
  var [result, setResult] = useState('')
  var [loading, setLoading] = useState(false)
  var [error, setError] = useState('')
  var [history, setHistory] = useState<TranslateRecord[]>([])
  var [showHistory, setShowHistory] = useState(false)

  var loadHistory = useCallback(async function() {
    try {
      var records = await db.translationLogs.orderBy('createdAt').reverse().limit(20).toArray()
      setHistory(records)
    } catch { setHistory([]) }
  }, [])

  useEffect(function() { loadHistory() }, [loadHistory])

  var handleTranslate = useCallback(async function() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult('')
    try {
      var aiConfigs = useStore.getState().aiConfigs
      var cfg = aiConfigs.find(function(c) { return c.enabled && c.apiKey })
      if (!cfg) { throw new Error('请在设置中配置 AI 平台和 API Key') }

      var systemPrompt = direction === 'classical_to_modern'
        ? '请将以下文言文翻译成白话文，只输出译文，不要任何额外说明。'
        : '请将以下白话文改写成文言文，只输出改写结果，不要任何额外说明。'

      // Use chat but prepend the translation instruction to the message
      var reply = await chat(cfg.platform, cfg.apiKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text.trim() },
      ], cfg.model)

      setResult(reply)

      await db.translationLogs.add({
        text: text.trim(),
        direction: direction,
        translated: reply,
        createdAt: new Date(),
      })
      loadHistory()
    } catch (err: any) {
      setError(err.message || '翻译失败')
    } finally {
      setLoading(false)
    }
  }, [text, direction, loadHistory])

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        使用 AI 进行文言文和白话文之间的翻译。文字限制 2000 字以内。
      </div>

      <div className="flex items-center gap-2">
        {TRANSLATE_DIRECTIONS.map(function(d) {
          var active = direction === d.value
          return (
            <button key={d.value} onClick={function() { setDirection(d.value) }}
              className={'rounded-full px-4 py-1.5 text-sm transition-colors ' + (active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {d.label}
            </button>
          )
        })}
      </div>

      <div>
        <textarea value={text} onChange={function(e) { setText(e.target.value.slice(0, 2000)) }}
          placeholder={direction === 'classical_to_modern' ? '输入文言文...' : '输入白话文...'}
          className="min-h-[160px] w-full resize-y rounded-xl border border-input bg-background p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="mt-1 text-right text-xs text-muted-foreground">{text.length}/2000</div>
      </div>

      <button onClick={handleTranslate} disabled={loading || !text.trim()}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
        {loading ? '翻译中...' : '翻译'}
      </button>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
          <div className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">翻译结果</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <button onClick={function() { setShowHistory(!showHistory) }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {showHistory ? '收起翻译历史（' + history.length + '）' : '展开翻译历史（' + history.length + '）'}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {history.map(function(h, i) {
                return (
                  <div key={h.id || i} className="rounded-xl border border-border bg-card p-3 text-sm">
                    <div className="mb-0.5 text-xs text-muted-foreground">
                      {h.direction === 'classical_to_modern' ? '文言→白话' : '白话→文言'}
                      <span className="ml-2">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mb-1 text-xs text-foreground/70">{h.text}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">{h.translated}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== 朗读面板 ====================

var TTS_KEY = 'tools:tts:config'

interface TTSConfig {
  voiceURI: string
  rate: number
  pitch: number
}

function loadTTSConfig(): TTSConfig {
  try { return JSON.parse(localStorage.getItem(TTS_KEY) || 'null') || { voiceURI: '', rate: 0.9, pitch: 1 } }
  catch { return { voiceURI: '', rate: 0.9, pitch: 1 } }
}

function saveTTSConfig(cfg: TTSConfig) {
  localStorage.setItem(TTS_KEY, JSON.stringify(cfg))
}

function TTSPanel() {
  var [text, setText] = useState('')
  var [playing, setPlaying] = useState(false)
  var [error, setError] = useState('')
  var [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  var [config, setConfig] = useState<TTSConfig>(loadTTSConfig)

  useEffect(function() {
    if (!('speechSynthesis' in window)) return
    var update = function() { setVoices(speechSynthesis.getVoices()) }
    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return function() { speechSynthesis.removeEventListener('voiceschanged', update) }
  }, [])

  var zhVoices = voices.filter(function(v) { return v.lang.startsWith('zh') })

  var updateConfig = function(partial: Partial<TTSConfig>) {
    setConfig(function(prev) {
      var next = { ...prev, ...partial }
      saveTTSConfig(next)
      return next
    })
  }

  var speak = function() {
    if (!text.trim()) return
    if (!('speechSynthesis' in window)) {
      setError('当前浏览器不支持语音合成')
      return
    }
    window.speechSynthesis.cancel()
    var u = new SpeechSynthesisUtterance(text.trim())
    u.lang = 'zh-CN'
    u.rate = config.rate
    u.pitch = config.pitch
    if (config.voiceURI) {
      var found = voices.find(function(v) { return v.voiceURI === config.voiceURI })
      if (found) u.voice = found
    }
    u.onstart = function() { setPlaying(true); setError('') }
    u.onend = function() { setPlaying(false) }
    u.onerror = function() { setPlaying(false); setError('朗读出错') }
    window.speechSynthesis.speak(u)
  }

  var stop = function() {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        使用浏览器本地语音合成朗读文本，不限次数。文字限制 1000 字以内。
      </div>

      {/* 音色/语速/音调 紧凑设置 */}
      <div className="flex items-center gap-2">
        <div className="w-32 relative">
          <select value={config.voiceURI} onChange={function(e) { updateConfig({ voiceURI: e.target.value }) }}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
            <option value="">系统默认</option>
            {zhVoices.map(function(v) {
              return <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
            })}
          </select>
          {voices.length === 0 && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">加载中...</span>}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          语速
          <input type="range" min="0.3" max="2" step="0.1" value={config.rate}
            onChange={function(e) { updateConfig({ rate: parseFloat(e.target.value) }) }}
            className="w-16 accent-primary" />
          <span className="tabular-nums w-6">{config.rate.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          音调
          <input type="range" min="0.5" max="2" step="0.1" value={config.pitch}
            onChange={function(e) { updateConfig({ pitch: parseFloat(e.target.value) }) }}
            className="w-16 accent-primary" />
          <span className="tabular-nums w-6">{config.pitch.toFixed(1)}</span>
        </label>
      </div>

      <div>
        <textarea value={text} onChange={function(e) { setText(e.target.value.slice(0, 1000)) }}
          placeholder="输入要朗读的文本..."
          className="min-h-[140px] w-full resize-y rounded-xl border border-input bg-background p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="mt-1 text-right text-xs text-muted-foreground">{text.length}/1000</div>
      </div>

      {playing ? (
        <button onClick={stop}
          className="w-full rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90">
          停止朗读
        </button>
      ) : (
        <button onClick={speak} disabled={!text.trim()}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          朗读
        </button>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}
    </div>
  )
}

// ==================== 字迹演练面板 ====================

function HandwritingPanel() {
  var [char, setChar] = useState('')
  var [history, setHistory] = useState<string[]>(function() {
    try { return JSON.parse(localStorage.getItem('tools:handwriting:history') || '[]') }
    catch { return [] }
  })
  var inputRef = useRef<HTMLInputElement>(null)
  var canvasRef = useRef<HTMLDivElement>(null)
  var writerRef = useRef<any>(null)
  var [charInfo, setCharInfo] = useState<any>(null)
  var [infoLoading, setInfoLoading] = useState(false)

  useEffect(function() {
    if (!char || !canvasRef.current) return
    var cancelled = false
    canvasRef.current.innerHTML = ''
    ;(async function() {
      var HanziWriter = (await import('hanzi-writer')).default
      if (cancelled) return
      var writer = HanziWriter.create(canvasRef.current!, char, {
        width: 300, height: 300, padding: 8,
        strokeColor: '#333', radicalColor: '#e74c3c',
        showOutline: true, showCharacter: false,
        delayBetweenStrokes: 300, delayBetweenLoops: 2000,
      })
      writerRef.current = writer
    })()
    return function() { cancelled = true; writerRef.current = null }
  }, [char])

  useEffect(function() {
    if (!char) { setCharInfo(null); return }
    setInfoLoading(true)
    ;(async function() {
      try {
        var pinyinPro = await import('pinyin-pro')
        var py = String(pinyinPro.pinyin(char, { toneType: 'symbol', multiple: true }))

        var cnchar = (await import('cnchar')).default
        await import('cnchar-order')
        var strokes = cnchar.stroke(char, 'order')
        var strokeCount = Array.isArray(strokes) ? strokes.length : (typeof strokes === 'number' ? strokes : 0)

        var commonMeanings: Record<string, string> = {
          '日': '太阳', '月': '月亮', '水': '无色无味的液体', '火': '燃烧产生的光焰',
          '山': '地面形成的高耸部分', '石': '构成地壳的坚硬物质', '田': '耕种的土地',
          '木': '树木', '花': '植物的繁殖器官', '草': '草本植物的统称',
          '鸟': '有翅膀的卵生动物', '鱼': '水生脊椎动物', '虫': '昆虫或类似生物',
          '人': '能制造工具的高级动物', '大': '面积、体积超过一般', '小': '面积、体积不及一般',
          '上': '位置在高处', '下': '位置在低处', '中': '中间、里面',
          '一': '最小的正整数', '二': '一加一的和', '三': '二加一的和',
          '十': '九加一的和', '百': '十个十', '千': '十个百',
          '万': '十个千', '天': '日月星辰罗列的广大空间', '地': '地球的表面',
          '风': '空气流动的现象', '云': '由水滴聚集而成的悬浮体', '雨': '从云层降下的水滴',
          '雪': '从云层降下的白色结晶体', '春': '四季之首', '夏': '四季之二',
          '秋': '四季之三', '冬': '四季之末', '年': '地球绕太阳一周的时间',
        }

        setCharInfo({ pinyin: py, strokeCount: strokeCount, meaning: commonMeanings[char] || '（待补充）' })
      } catch {
        try {
          var pinyinPro2 = await import('pinyin-pro')
          var py2 = String(pinyinPro2.pinyin(char, { toneType: 'symbol', multiple: true }))
          setCharInfo({ pinyin: py2, strokeCount: 0, meaning: '' })
        } catch { setCharInfo(null) }
      } finally { setInfoLoading(false) }
    })()
  }, [char])

  var startDemo = function() {
    if (!inputRef.current) return
    var v = inputRef.current.value.trim()
    if (!v) return
    if (!/[\u4e00-\u9fff]/.test(v[0])) return
    var c = v[0]
    setChar(c)
    setHistory(function(prev) {
      var next = [c, ...prev.filter(function(x) { return x !== c })].slice(0, 50)
      localStorage.setItem('tools:handwriting:history', JSON.stringify(next))
      return next
    })
  }

  var handleKeyDown = function(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') startDemo()
  }

  var saveToHistory = function() {
    if (!char) return
    setHistory(function(prev) {
      var next = [char, ...prev.filter(function(x) { return x !== char })].slice(0, 50)
      localStorage.setItem('tools:handwriting:history', JSON.stringify(next))
      return next
    })
  }

  var clearHistory = function() {
    setHistory([])
    localStorage.removeItem('tools:handwriting:history')
  }

  return (
    <div className="flex flex-col md:flex-row gap-12">
      <div className="w-full md:w-80 shrink-0 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">输入汉字</label>
          <div className="flex gap-2">
            <input ref={inputRef} onKeyDown={handleKeyDown} placeholder="输入一个汉字" maxLength={1}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-center text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={startDemo}
              className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
              开始
            </button>
          </div>
        </div>
        {char && (
          <button onClick={saveToHistory}
            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            保存到历史
          </button>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">历史记录</span>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">清空</button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">暂无记录</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {history.map(function(c) {
                return (
                  <button key={c} onClick={function() { setChar(c) }}
                    className={'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors hover:bg-accent ' + (char === c ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>
                    {c}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="mb-3 text-sm text-muted-foreground">
          {char ? '「' + char + '」的笔顺演示' : '在左侧输入一个汉字'}
        </div>
        <div ref={canvasRef}
          className="flex items-center justify-center rounded-2xl border-2 border-border bg-white dark:bg-neutral-900"
          style={{ width: 320, height: 320 }} />
        {char && (
          <div className="mt-3 flex gap-3">
            <button onClick={function() { writerRef.current?.animateCharacter?.() }}
              className="rounded-xl bg-muted px-5 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-80">重播笔顺</button>
            <button onClick={function() { writerRef.current?.quiz?.() }}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">开始描写</button>
          </div>
        )}
        {char && (
          <div className="mt-6 w-full max-w-sm space-y-2 rounded-xl border border-border bg-card p-4">
            <div className="mb-1 text-sm font-medium text-foreground">「{char}」的信息</div>
            {infoLoading ? (
              <div className="text-xs text-muted-foreground">加载中...</div>
            ) : charInfo ? (
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {charInfo.pinyin && <div>拼音：<span className="text-foreground font-medium">{charInfo.pinyin}</span></div>}
                {charInfo.strokeCount > 0 && <div>笔画：<span className="text-foreground font-medium">{charInfo.strokeCount}</span>画</div>}
                {charInfo.meaning && <div>释义：<span className="text-foreground">{charInfo.meaning}</span></div>}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">暂未查到该字信息</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
