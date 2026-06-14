import { useState } from 'react'
import { useUserStore } from '../store/user'
import { User, Check, Plus, ChevronRight, LogOut } from 'lucide-react'

export default function Users() {
  const { users, currentUser, switchUser, createUser } = useUserStore()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    await createUser(name.trim())
    setShowCreate(false)
    setName('')
  }

  return (
    <div className="space-y-4 animate-fade-up max-w-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
        <h1 className="text-lg font-bold">用户管理</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        当前：<span className="font-medium text-foreground">{currentUser?.name}</span>
        {currentUser?.guest === 1 && <span className="text-xs ml-1 text-muted-foreground">（游客模式）</span>}
      </p>

      <div className="space-y-1">
        {users.map(u => {
          const active = u.id === currentUser?.id
          return (
            <button
              key={u.id}
              onClick={() => { if (!active) switchUser(u) }}
              disabled={active}
              className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                active ? 'bg-primary/5 border-primary/30' : 'bg-card hover:border-primary/30'
              }`}
            >
              <div className={'flex h-10 w-10 items-center justify-center rounded-full ' + (u.guest === 1 ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.guest === 1 ? '游客模式' : '已注册'}</p>
              </div>
              {active && <Check className="h-4 w-4 text-primary" />}
              {!active && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
            </button>
          )
        })}
      </div>

      {showCreate ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <input
            type="text"
            placeholder="输入用户名..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowCreate(false); setName('') }} className="flex-1 rounded-lg border py-2 text-sm">取消</button>
            <button onClick={handleCreate} disabled={!name.trim()} className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50">创建</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          创建新用户
        </button>
      )}

      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground space-y-1">
        <p className="text-xs">💡 第一个创建的用户将自动继承游客模式的所有数据（学习计划、复习记录、收藏、AI配置）。</p>
      </div>
    </div>
  )
}
