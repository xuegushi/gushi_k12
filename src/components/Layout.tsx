import { Outlet, Link, useLocation } from 'react-router-dom'
import { useUserStore } from '../store/user'
import { useUIConfig } from '../store/ui'
import { BookOpen, Home, Library, Settings, TrendingUp, Sparkles, RotateCcw, Sun, Moon, GraduationCap, User } from 'lucide-react'

const NAV = [
  { path: '/', label: '首页', icon: Home },
  { path: '/poems', label: '诗词', icon: BookOpen },
  { path: '/study-plan', label: '计划', icon: Library },
  { path: '/review', label: '复习', icon: RotateCcw },
  { path: '/progress', label: '进度', icon: TrendingUp },
  { path: '/ai-settings', label: 'AI', icon: Sparkles },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { theme, setTheme } = useUIConfig()
  const currentUser = useUserStore(s => s.currentUser)
  const isDark = theme === 'dark'

  const userName = currentUser?.name || '游客'
  const userInitial = userName.charAt(0)

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <div className="min-h-dvh flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:z-30 lg:bg-sidebar lg:border-r">
        <div className="flex items-center gap-3 px-5 h-14 border-b border-sidebar/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <span className="text-sm font-bold font-poem">诗</span>
          </div>
          <div>
            <span className="font-bold text-sm">古诗学习</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">K12 古诗词</p>
          </div>
        </div>

        <nav className="flex-1 py-2 px-3 space-y-0.5">
          {NAV.map(function(item) {
            var active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
            return (
              <Link key={item.path} to={item.path}
                className={'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ' + (active
                  ? 'bg-white dark:bg-sidebar-item text-primary font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-item/50')}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />}
                <item.icon className={'h-4 w-4 ' + (active ? 'text-primary' : '')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-sidebar/50 space-y-1">
          <button onClick={toggleTheme}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-item/50 transition-colors">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? '浅色模式' : '深色模式'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-dvh lg:pl-60">
        <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>K12 古诗学习</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/users" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                {userInitial}
              </div>
              <span className="max-w-[80px] truncate">{userName}</span>
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={isDark ? '浅色模式' : '深色模式'}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 lg:max-w-screen-xl lg:mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur-sm lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {NAV.map(function(item) {
            var active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
            return (
              <Link key={item.path} to={item.path}
                className={'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ' + (active ? 'text-primary' : 'text-muted-foreground')}>
                <item.icon className={'h-5 w-5 ' + (active ? 'fill-current' : '')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
