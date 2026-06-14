import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { useUserStore } from '../store/user'
import { db, type AiConfig } from '../lib/db'
import { getPlatforms, fetchModels } from '../lib/ai'
import { Save, Eye, EyeOff, BarChart3, Sparkles, Settings as SettingsIcon, History } from 'lucide-react'

export default function AiSettings() {
  var [tab, setTab] = useState('config')
  var aiConfigs = useStore(s => s.aiConfigs)
  var loadAiConfigs = useStore(s => s.loadAiConfigs)
  var userId = useUserStore(s => s.currentUser?.id)
  var platforms = getPlatforms()

  var [keys, setKeys] = useState<Record<string, string>>({})
  var [models, setModels] = useState<Record<string, string>>({})
  var [availModels, setAvailModels] = useState<Record<string, string[]>>({})
  var [savedId, setSavedId] = useState('')
  var [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  var [usageStats, setUsageStats] = useState<any[]>([])
  var [logs, setLogs] = useState<any[]>([])
  var [logPage, setLogPage] = useState(1)
  var [logTotal, setLogTotal] = useState(0)
  var pageSize = 20

  // Load availModels from aiConfigs
  useEffect(function() {
    var m: Record<string, string[]> = {}
    aiConfigs.forEach(function(c) {
      if (c.availModels && c.availModels.length > 0) m[c.platform] = c.availModels
    })
    if (Object.keys(m).length > 0) setAvailModels(m)
  }, [aiConfigs])

  useEffect(function() { if (userId) loadAiConfigs() }, [userId])

  useEffect(function() {
    var m: Record<string, string> = {}
    var mm: Record<string, string> = {}
    aiConfigs.forEach(function(c) {
      m[c.platform] = c.apiKey
      if (c.model) mm[c.platform] = c.model
    })
    setKeys(m)
    setModels(mm)
  }, [aiConfigs])

  useEffect(function() {
    db.aiCallLogs.toArray().then(function(all) {
      // Stats
      var map: Record<string, { calls: number; tokens: number; duration: number }> = {}
      for (var log of all) {
        if (!map[log.platform]) map[log.platform] = { calls: 0, tokens: 0, duration: 0 }
        map[log.platform].calls++
        map[log.platform].tokens += log.totalTokens || 0
        map[log.platform].duration += log.duration || 0
      }
      var arr = Object.entries(map).map(function([k, v]) { return { platform: k, ...v } })
      setUsageStats(arr)

      // Paginated logs
      setLogTotal(all.length)
      setLogs(all.reverse().slice(0, pageSize))
    })
  }, [])

  var loadLogPage = async function(page: number) {
    var all = await db.aiCallLogs.toArray()
    var total = all.length
    var start = (page - 1) * pageSize
    var paged = all.reverse().slice(start, start + pageSize)
    setLogs(paged)
    setLogPage(page)
    setLogTotal(total)
  }

  var totalPages = Math.ceil(logTotal / pageSize)
  var platformName = function(id: string) {
    return ({ qwen: '通义千问', deepseek: 'DeepSeek', kimi: 'Kimi', minimax: 'MiniMax' } as any)[id] || id
  }

  var saveKey = async function(platform: string) {
    if (!userId) return
    var existing = aiConfigs.find(function(c) { return c.platform === platform })
    var cfg: AiConfig = {
      id: existing?.id,
      userId: 0,
      platform: platform as AiConfig['platform'],
      apiKey: keys[platform] || '',
      model: models[platform] || undefined,
      enabled: true,
    }
    await useStore.getState().saveAiConfig(cfg)
    setSavedId(platform)
    setTimeout(function() { setSavedId('') }, 2000)

    // Auto-fetch models after saving key
    if (keys[platform]) {
      var list = await fetchModels(platform, keys[platform])
      if (list.length > 0) {
        setAvailModels(function(prev) { return { ...prev, [platform]: list } })
      }
    }
  }

  var totalCalls = usageStats.reduce(function(sum, s) { return sum + s.calls }, 0)
  var totalTokens = usageStats.reduce(function(sum, s) { return sum + s.tokens }, 0)
  var totalDuration = usageStats.reduce(function(sum, s) { return sum + s.duration }, 0)

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">AI 设置</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
        <button onClick={function() { setTab('config') }}
          className={tab === 'config' ? 'px-3 py-1.5 text-xs font-medium rounded-md bg-card text-foreground shadow-sm flex items-center gap-1' : 'px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground flex items-center gap-1'}>
          <SettingsIcon className="h-3.5 w-3.5" /> 配置
        </button>
        <button onClick={function() { setTab('usage') }}
          className={tab === 'usage' ? 'px-3 py-1.5 text-xs font-medium rounded-md bg-card text-foreground shadow-sm flex items-center gap-1' : 'px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground flex items-center gap-1'}>
          <History className="h-3.5 w-3.5" /> 使用记录
        </button>
      </div>

      {tab === 'config' ? (
        /* API Configs */
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">API Key 仅存储在本地浏览器中。</p>
          <div className="grid gap-3">
              {platforms.map(function(p) {
                return (
                  <div key={p.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input type={showKeys[p.id] ? 'text' : 'password'}
                          placeholder="输入 API Key..."
                          value={keys[p.id] || ''}
                          onChange={function(e) { setKeys({ ...keys, [p.id]: e.target.value }) }}
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-9" />
                        <button onClick={function() { setShowKeys({ ...showKeys, [p.id]: !showKeys[p.id] }) }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showKeys[p.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button onClick={function() { saveKey(p.id) }}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
                        {savedId === p.id ? '已保存' : <Save className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2 items-center">
                      <select value={models[p.id] || p.defaultModel}
                        onChange={function(e) { setModels({ ...models, [p.id]: e.target.value }) }}
                        className="flex-1 px-2 py-1.5 rounded-lg border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        {(availModels[p.id] || p.models).map(function(m) {
                          return <option key={m} value={m}>{m}</option>
                        })}
                      </select>
                      <button onClick={async function() {
                        var key = keys[p.id]
                        if (!key) return
                        var list = await fetchModels(p.id, key)
                        if (list.length > 0) {
                          setAvailModels(function(prev) { return { ...prev, [p.id]: list } })
                          // Save to aiConfigs
                          var cfg = aiConfigs.find(function(c) { return c.platform === p.id })
                          if (cfg && cfg.id) {
                            await db.aiConfigs.update(cfg.id, { availModels: list })
                          }
                        }
                      }} className="shrink-0 px-2 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground transition-colors">
                        获取模型
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ) : (
        /* Usage Records */
        <div className="space-y-3">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xl font-bold">{totalCalls}</p>
              <p className="text-xs text-muted-foreground">总调用</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xl font-bold">{(totalTokens / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">总 Tokens</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xl font-bold">{Math.round(totalDuration / 1000)}s</p>
              <p className="text-xs text-muted-foreground">总耗时</p>
            </div>
          </div>

          {/* Stats by platform */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">各平台统计</h3>
            {usageStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无调用记录</p>
            ) : (
              <div className="space-y-2">
                {usageStats.map(function(s) {
                  return (
                    <div key={s.platform} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{platformName(s.platform)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <span className="mr-2">{s.calls} 次</span>
                        <span className="mr-2">{(s.tokens / 1000).toFixed(1)}K</span>
                        <span>{Math.round(s.duration / 1000)}s</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Call log list */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">调用明细</h3>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无调用记录</p>
            ) : (
              <div className="space-y-1">
                {logs.map(function(log, i) {
                  return (
                    <div key={log.id || i} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">{platformName(log.platform)}</span>
                        <span className="text-muted-foreground">{log.model}</span>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="mr-2">{(log.totalTokens || 0).toLocaleString()} tokens</span>
                        <span>{Math.round((log.duration || 0) / 1000)}s</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                <button onClick={function() { if (logPage > 1) loadLogPage(logPage - 1) }}
                  className={'px-2 py-1 text-xs rounded-md border ' + (logPage <= 1 ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground')}>
                  &larr; 上一页
                </button>
                <span className="text-xs text-muted-foreground">{logPage}/{totalPages}</span>
                <button onClick={function() { if (logPage < totalPages) loadLogPage(logPage + 1) }}
                  className={'px-2 py-1 text-xs rounded-md border ' + (logPage >= totalPages ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground')}>
                  下一页 &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
