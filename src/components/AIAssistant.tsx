import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import { useSelectionStore } from '../store/selection'
import { db } from '../lib/db'
import { chat, getPlatforms, fetchModels } from '../lib/ai'
import { Send, Square, Loader2, Sparkles, Volume2, Copy, Check, Trash2, X, AlertTriangle, Cpu } from 'lucide-react'

const PLATFORM_LABELS: Record<string, string> = { qwen: '通义千问', deepseek: 'DeepSeek', kimi: 'Kimi', minimax: 'MiniMax' }

export default function AIAssistant() {
  var poemContext = useSelectionStore(s => s.poemContext)
  var aiConfigs = useStore(s => s.aiConfigs)
  var configuredPlatforms = aiConfigs.filter(function(c) { return c.enabled && c.apiKey })
  var aiPrompt = useSelectionStore(s => s.aiPrompt)

  var [msgs, setMsgs] = useState<{ role: string; content: string }[]>([])
  var [input, setInput] = useState('')
  var [loading, setLoading] = useState(false)
  var [open, setOpen] = useState(false)
  var [copied, setCopied] = useState('')
  var [confirmClear, setConfirmClear] = useState(false)
  var [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  var [currPlatform, setCurrPlatform] = useState('')
  var [currModel, setCurrModel] = useState('')
  var [availModels, setAvailModels] = useState<string[]>([])
  var bottomRef = useRef<HTMLDivElement>(null)

  // Auto-open and fill input when aiPrompt is set from text selection
  useEffect(function() {
    if (aiPrompt) {
      setOpen(true)
      setInput(aiPrompt)
      useSelectionStore.getState().setAiPrompt('')
    }
  }, [aiPrompt])

  // Set initial platform/model when configs change
  useEffect(function() {
    if (configuredPlatforms.length > 0 && !currPlatform) {
      var first = configuredPlatforms[0]
      setCurrPlatform(first.platform)
      setCurrModel(first.model || '')
    }
  }, [configuredPlatforms])

  var currentCfg = configuredPlatforms.find(function(c) { return c.platform === currPlatform })

  // Load available models when platform changes
  useEffect(function() {
    if (!currentCfg) { setAvailModels([]); return }
    // Use hardcoded list first
    var cfg = currentCfg
    var platform = getPlatforms().find(function(p) { return p.id === cfg.platform })
    if (platform) setAvailModels(platform.models)
    // Try API fetch
    fetchModels(currentCfg.platform, currentCfg.apiKey).then(function(list) {
      if (list.length > 0) setAvailModels(list)
    })
  }, [currPlatform])

  useEffect(function() {
    if (!open) return
    db.chatMessages.orderBy('timestamp').toArray().then(function(rows) {
      setMsgs(rows.map(function(r) { return { role: r.role, content: r.content } }))
    })
  }, [open])

  function saveMsg(role: string, content: string) {
    db.chatMessages.add({ userId: 0, role: role as any, content: content, timestamp: new Date() })
  }

  function clearHistory() {
    db.chatMessages.clear()
    setMsgs([])
  }

  function deleteMsg(index: number) {
    var msg = msgs[index]
    if (!msg) return
    db.chatMessages.filter(function(r) {
      return r.role === msg.role && r.content === msg.content
    }).first().then(function(row) {
      if (row?.id) db.chatMessages.delete(row.id)
    })
    setMsgs(function(prev) { return prev.filter(function(_, i) { return i !== index }) })
  }

  useEffect(function() { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  var send = useCallback(async function() {
    if (!input.trim() || loading || !currentCfg) return
    var text = input.trim()
    var userMsg = { role: 'user' as const, content: text }
    setMsgs(function(prev) { return [...prev, userMsg] })
    saveMsg('user', text)
    setInput('')
    setLoading(true)
    try {
      var ctx = poemContext ? '当前诗词《' + poemContext.title + '》' + poemContext.author + '\n' + poemContext.content.slice(0, 200) : ''
      var msgsToSend = ctx ? [{ role: 'system', content: ctx }, ...msgs, userMsg] : [...msgs, userMsg]
      var reply = await chat(currentCfg.platform, currentCfg.apiKey, msgsToSend, currModel || currentCfg.model)
      setMsgs(function(prev) { return [...prev, { role: 'assistant', content: reply }] })
      saveMsg('assistant', reply)
    } catch (err: any) {
      setMsgs(function(prev) { return [...prev, { role: 'assistant', content: '❌ ' + err.message }] })
    } finally {
      setLoading(false)
    }
  }, [input, loading, currentCfg, msgs, poemContext, currModel])

  var speak = function(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      var u = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''))
      u.lang = 'zh-CN'
      window.speechSynthesis.speak(u)
    }
  }

  if (!open) {
    return (
      <button onClick={function() { setOpen(true) }}
        className="fixed bottom-20 right-4 z-40 lg:bottom-6 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors">
        <Sparkles className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed inset-4 z-40 lg:inset-y-6 lg:right-6 lg:left-auto lg:w-96 bg-card rounded-2xl shadow-xl border flex flex-col animate-fade-up">
      {/* Header */}
      <div className="flex items-center p-3 border-b shrink-0 gap-2">
        <span className="text-sm font-medium flex items-center gap-1.5 flex-1">
          <Sparkles className="h-4 w-4 text-primary" /> AI 助手
          {msgs.length > 0 && <button onClick={function() { setConfirmClear(true) }} className="text-xs text-muted-foreground hover:text-destructive ml-2 flex items-center gap-0.5"><Trash2 className="h-3 w-3" /> 清空记录</button>}
        </span>
        <button onClick={function() { setOpen(false) }} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
        {msgs.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6">
            {configuredPlatforms.length > 0 ? '有什么想了解的吗？' : '请先在设置中配置 AI API Key'}
          </div>
        )}
        {msgs.map(function(m, i) {
          return (
            <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[85%] rounded-xl px-3 text-sm ' + (m.role === 'user' ? 'bg-primary text-primary-foreground py-1.5' : 'bg-muted text-foreground py-2')}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="flex gap-3 mt-1 justify-end">
                  {m.role === 'user' ? (
                    <button onClick={function() { setDeleteTarget(i) }} className="text-white/50 hover:text-white"><X className="h-3 w-3" /></button>
                  ) : (
                    <button onClick={function() { setDeleteTarget(i) }} className="text-muted-foreground/60 hover:text-destructive"><X className="h-3 w-3" /></button>
                  )}
                  {m.role === 'assistant' && (
                    <>
                      <button onClick={function() { speak(m.content) }} className="text-muted-foreground hover:text-foreground"><Volume2 className="h-3 w-3" /></button>
                      <button onClick={async function() { await navigator.clipboard.writeText(m.content); setCopied(String(i)); setTimeout(function() { setCopied('') }, 1500) }} className="text-muted-foreground hover:text-foreground">
                        {copied === String(i) ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> 思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        <div className="flex gap-2">
          <input type="text" value={input}
            onChange={function(e) { setInput(e.target.value) }}
            onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) send() }}
            placeholder={currentCfg ? '输入问题...' : '未配置 AI'}
            disabled={!currentCfg || loading}
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all" />
          {loading ? (
            <button className="p-2 text-destructive"><Square className="h-4 w-4" /></button>
          ) : (
            <button onClick={send} disabled={!input.trim() || !currentCfg} className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Platform / Model selector */}
        {configuredPlatforms.length > 0 && (
          <div className="flex gap-2 mt-2 items-center">
            <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
            <select value={currPlatform} onChange={function(e) { setCurrPlatform(e.target.value); setCurrModel('') }}
              className="flex-1 px-2 py-1 rounded-md border bg-background text-[10px] outline-none">
              {configuredPlatforms.map(function(c) {
                return <option key={c.platform} value={c.platform}>{PLATFORM_LABELS[c.platform] || c.platform}</option>
              })}
            </select>
            <select value={currModel || availModels[0] || ''} onChange={function(e) { setCurrModel(e.target.value) }}
              className="flex-1 px-2 py-1 rounded-md border bg-background text-[10px] outline-none">
              {availModels.map(function(m) {
                return <option key={m} value={m}>{m}</option>
              })}
            </select>
          </div>
        )}
      </div>

      {/* Confirm clear dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={function() { setConfirmClear(false) }}>
          <div className="bg-card rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium">清空确认</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">确定要清空所有对话记录吗？此操作不可撤销。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={function() { setConfirmClear(false) }} className="px-3 py-1.5 rounded-lg border text-sm">取消</button>
              <button onClick={function() { clearHistory(); setConfirmClear(false) }} className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">清空</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete single message */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={function() { setDeleteTarget(null) }}>
          <div className="bg-card rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full" onClick={function(e) { e.stopPropagation() }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium">删除确认</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">确定要删除这条记录吗？</p>
            <div className="flex gap-2 justify-end">
              <button onClick={function() { setDeleteTarget(null) }} className="px-3 py-1.5 rounded-lg border text-sm">取消</button>
              <button onClick={function() { if (deleteTarget !== null) { deleteMsg(deleteTarget); setDeleteTarget(null) } }} className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
