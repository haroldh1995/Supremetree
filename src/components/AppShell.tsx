import {
  Archive,
  BookOpen,
  Clock3,
  GitBranch,
  Home,
  ListChecks,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Swords,
  TreePine,
  WandSparkles,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppState } from '../state/AppState'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/sessions', label: 'Sessions', icon: ListChecks },
  { to: '/draw', label: 'Draw', icon: WandSparkles },
  { to: '/powers', label: 'Powers', icon: Swords },
  { to: '/tree', label: 'Tree', icon: TreePine },
  { to: '/timeline', label: 'Timeline', icon: Clock3 },
  { to: '/catch-up', label: 'Catch-Up', icon: GitBranch },
  { to: '/convergence', label: 'Convergence', icon: Sparkles },
  { to: '/living-answer', label: 'Living Answer', icon: Shield },
  { to: '/audit', label: 'Audit', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/backup', label: 'Backup', icon: Archive },
  { to: '/help', label: 'Help', icon: BookOpen },
]

export function AppShell() {
  const { data, schedule } = useAppState()
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-sigil" aria-hidden="true">
            D
          </div>
          <div>
            <strong>Dumare</strong>
            <span>Power Realization Tracker</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <div className="main-region">
        <header className="topbar">
          <div>
            <span className="eyeless-label">Campaign</span>
            <strong>{data.settings?.campaignName ?? data.campaign?.name}</strong>
          </div>
          <div className="status-strip">
            <span>Month {schedule?.campaignMonth ?? 1}</span>
            <span>{schedule?.daysRemaining ?? 0} days left</span>
            <span className={`status-pill status-${schedule?.status ?? 'on-schedule'}`}>
              {schedule?.status.replace('-', ' ') ?? 'on schedule'}
            </span>
          </div>
        </header>
        <main className="content" id="main-content">
          <Outlet />
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="bottom-link">
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
