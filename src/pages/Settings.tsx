import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useUserStore } from '../store/user'
import { useUIConfig, type ColorScheme } from '../store/ui'
import { Sun, Moon, Info, User, ChevronRight, Palette, Sparkles } from 'lucide-react'

const SCHEMES: { id: ColorScheme; label: string; desc: string }[] = [
  { id: 'default', label: '经典蓝', desc: '标准蓝色主题' },
  { id: 'ink', label: '墨韵书香', desc: '墨色朱红，书香气息' },
  { id: 'nature', label: '青山绿水', desc: '青绿自然主题' },
  { id: 'vermillion', label: '朱砂红笺', desc: '朱红笺纸，古韵典雅' },
  { id: 'playful', label: '童趣古韵', desc: '明快蓝黄，活泼生动' },
]

export default function Settings() {
  var currentUser = useUserStore(s => s.currentUser)
  var { theme, colorScheme, setTheme, setColorScheme } = useUIConfig()
  var isDark = theme === 'dark'

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Info className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">设置</h1>
      </div>

      {/* User */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">用户</h2>
        <Link to="/users" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{currentUser?.name || '游客'}</p>
            <p className="text-xs text-muted-foreground">{currentUser?.guest === 1 ? '游客模式 · 点击切换/创建用户' : '点击管理用户'}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </Link>
      </div>

      {/* AI Settings */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">AI</h2>
        <Link to="/ai-settings" className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">AI 配置与统计</p>
            <p className="text-xs text-muted-foreground">API Key 配置、调用记录</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </Link>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">主题</h2>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <p className="text-sm font-medium">{isDark ? '深色模式' : '浅色模式'}</p>
              </div>
            </div>
            <button onClick={function() { setTheme(isDark ? 'light' : 'dark') }}
              className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (isDark ? 'bg-primary' : 'bg-muted-foreground/30')}>
              <span className={'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ' + (isDark ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">配色方案</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {SCHEMES.map(function(s) {
              return (
                <button key={s.id} onClick={function() { setColorScheme(s.id) }}
                  className={'rounded-xl border-2 p-3 text-left transition-all ' + (colorScheme === s.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted hover:bg-muted/70')}>
                  <div className="flex gap-1 mb-2">
                    {s.id === 'default' && <><div className="h-4 w-4 rounded-full bg-[#3b82f6]" /><div className="h-4 w-4 rounded-full bg-[#f59e0b]" /></>}
                    {s.id === 'ink' && <><div className="h-4 w-4 rounded-full bg-[#2c241a]" /><div className="h-4 w-4 rounded-full bg-[#b84a3a]" /></>}
                    {s.id === 'nature' && <><div className="h-4 w-4 rounded-full bg-[#308a6e]" /><div className="h-4 w-4 rounded-full bg-[#e8852e]" /></>}
                    {s.id === 'vermillion' && <><div className="h-4 w-4 rounded-full bg-[#b83a2a]" /><div className="h-4 w-4 rounded-full bg-[#e8a52e]" /></>}
                    {s.id === 'playful' && <><div className="h-4 w-4 rounded-full bg-[#3b6ef5]" /><div className="h-4 w-4 rounded-full bg-[#f5c518]" /></>}
                  </div>
                  <p className="text-xs font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">关于</h2>
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground space-y-1">
          <p>K12 古诗学习系统 v1.0</p>
          <p>纯前端应用，数据存储在本地</p>
          <p>诗词来源：<a href="https://xuegushi.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@学古诗 xuegushi.com</a></p>
        </div>
      </div>
    </div>
  )
}
