import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Copy,
  Database,
  Download,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Settings,
  Sheet,
  ShieldAlert,
  Sparkles,
  Sun,
  Users,
  Zap,
} from 'lucide-react'
import { segments } from '@/data/mock'
import { currentUser } from '@/data/mock'
import { useApp, type DemoState } from '@/state/AppState'
import { Modal } from '@/components/Overlay'
import ToastStack from '@/components/ToastStack'
import { Banner, Button, Popover, Select, cx } from '@/components/ui'

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/segments', label: 'Segments', icon: Users },
  { to: '/churn-risk', label: 'Churn Risk', icon: ShieldAlert },
  { to: '/feature-impact', label: 'Feature Impact', icon: FlaskConical },
  { to: '/recommendations', label: 'Recommendations', icon: ClipboardCheck, badge: true },
  { to: '/actions', label: 'Actions & Impact', icon: Zap },
  { to: '/pipeline', label: 'Pipeline & Data', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const titles: [string, string][] = [
  ['/segments', 'Segments'],
  ['/churn-risk', 'Churn Risk'],
  ['/feature-impact', 'Feature Impact'],
  ['/recommendations', 'Recommendations & Approvals'],
  ['/actions', 'Actions & Impact'],
  ['/pipeline', 'Pipeline & Data'],
  ['/settings', 'Settings'],
  ['/accounts', 'Customer Detail'],
]

const demoOptions: { value: DemoState; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'stale', label: 'Stale data' },
  { value: 'failedRun', label: 'Failed run' },
  { value: 'emptyPending', label: 'All caught up' },
]

export default function AppShell() {
  const { state, pendingIds, refresh, setMode, setSegment, setTheme, setDemo, toast } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('bi-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [confirmLive, setConfirmLive] = useState(false)
  const [range, setRange] = useState('90')
  const [source, setSource] = useState('all')

  useEffect(() => {
    try {
      localStorage.setItem('bi-sidebar', collapsed ? 'collapsed' : 'open')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 })
  }, [location.pathname])

  const title = location.pathname === '/' ? 'Overview' : (titles.find(([p]) => location.pathname.startsWith(p))?.[1] ?? 'Not found')
  const pending = pendingIds.length
  const live = state.mode === 'live'

  useEffect(() => {
    document.title = `${title} · SaaS BI Engine`
  }, [title])

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent">
        Skip to content
      </a>

      {/* Sidebar */}
      <aside className={cx('flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150', collapsed ? 'w-[72px]' : 'w-[240px]')} aria-label="Primary">
        <div className={cx('flex h-16 items-center border-b border-line', collapsed ? 'justify-center' : 'gap-3 px-5')}>
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent">
            <Activity size={18} strokeWidth={2.25} aria-hidden />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm leading-4 font-semibold text-fg">SaaS BI Engine</span>
              <span className="block text-xs text-fg-2">Churn intelligence</span>
            </span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? `${item.label}${item.badge && pending ? `, ${pending} pending` : ''}` : undefined}
                    className={({ isActive }) =>
                      cx(
                        'relative flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors',
                        collapsed ? 'justify-center' : 'px-3',
                        isActive ? 'bg-raised text-fg' : 'text-fg-2 hover:bg-raised/60 hover:text-fg',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r bg-accent" aria-hidden />}
                        <Icon size={18} strokeWidth={1.5} aria-hidden className={isActive ? 'text-accent' : undefined} />
                        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {item.badge && pending > 0 && (
                          <span
                            className={cx(
                              'num inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-decision px-1.5 text-xs font-semibold text-on-accent',
                              collapsed && 'absolute -top-1 right-1 h-4 min-w-4 px-1 text-[10px]',
                            )}
                            aria-label={collapsed ? undefined : `${pending} pending`}
                          >
                            {pending}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cx('mb-2 flex h-8 w-full items-center gap-3 rounded-md text-xs text-fg-2 hover:bg-raised hover:text-fg', collapsed ? 'justify-center' : 'px-3')}
          >
            {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
            {!collapsed && 'Collapse'}
          </button>
          <Popover
            width={248}
            side="top"
            trigger={({ open, toggle, id }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={open ? id : undefined}
                aria-label="Account menu"
                className={cx('flex w-full items-center gap-3 rounded-md py-1.5 text-left hover:bg-raised', collapsed ? 'justify-center' : 'px-2')}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-fg ring-1 ring-line">{currentUser.initials}</span>
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{currentUser.name}</span>
                    <span className="block truncate text-xs text-fg-2">{currentUser.title}</span>
                  </span>
                )}
              </button>
            )}
          >
            <div className="-mt-1 space-y-3" style={{ position: 'relative' }}>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-fg">Theme</p>
                <div className="grid grid-cols-2 gap-1 rounded-md bg-surface p-1">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={state.theme === t}
                      onClick={() => setTheme(t)}
                      className={cx('inline-flex h-7 items-center justify-center gap-1.5 rounded text-xs font-medium capitalize', state.theme === t ? 'bg-raised text-fg ring-1 ring-line' : 'text-fg-2 hover:text-fg')}
                    >
                      {t === 'dark' ? <Moon size={12} aria-hidden /> : <Sun size={12} aria-hidden />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-fg">
                  <Sparkles size={12} aria-hidden /> Preview states
                </p>
                <div className="space-y-0.5">
                  {demoOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={state.demoState === o.value}
                      onClick={() => setDemo(o.value)}
                      className={cx('flex h-7 w-full items-center justify-between rounded px-2 text-xs', state.demoState === o.value ? 'bg-surface text-fg' : 'text-fg-2 hover:text-fg')}
                    >
                      {o.label}
                      {state.demoState === o.value && <span className="size-1.5 rounded-full bg-accent" aria-hidden />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Popover>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-8">
          <p className="mr-auto truncate text-base font-semibold text-fg">{title}</p>
          <div className="flex items-center gap-2">
            <Select
              label="Date range"
              value={range}
              onChange={setRange}
              options={[
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '180', label: 'Last 180 days' },
              ]}
            />
            <Select
              label="Data source"
              value={source}
              onChange={setSource}
              options={[
                { value: 'all', label: 'All sources' },
                { value: 'billing', label: 'Billing (Stripe)' },
                { value: 'usage', label: 'Product usage' },
                { value: 'support', label: 'Support (Zendesk)' },
              ]}
            />
            <Select
              label="Segment"
              value={state.segmentFilter}
              onChange={(v) => setSegment(v as typeof state.segmentFilter)}
              options={[{ value: 'all', label: 'All segments' }, ...segments.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </div>
          <span className="h-6 w-px bg-line" aria-hidden />
          <div className="flex items-center gap-2 text-xs text-fg-2" aria-live="polite">
            <span className="whitespace-nowrap">
              {state.lastRun.loading ? 'Running analysis…' : (
                <>
                  Last analysis run: <span className="font-medium text-fg">{state.demoState === 'stale' ? '26h ago' : state.lastRun.label}</span>
                </>
              )}
            </span>
            <Button size="sm" variant="ghost" aria-label="Refresh analysis" onClick={refresh} disabled={state.lastRun.loading} icon={<RefreshCw size={14} aria-hidden className={state.lastRun.loading ? 'animate-spin' : undefined} />} />
          </div>
          <button
            type="button"
            onClick={() => (live ? setMode('dry-run') : setConfirmLive(true))}
            aria-label={`Execution mode: ${live ? 'Live' : 'Dry-run'}. Click to switch to ${live ? 'Dry-run' : 'Live'}.`}
            className={cx(
              'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold',
              live ? 'border-risk-high/50 bg-risk-high/12 text-risk-high' : 'border-line bg-raised text-fg-2 hover:text-fg',
            )}
          >
            <span className={cx('size-2 rounded-full', live ? 'animate-pulse bg-risk-high' : 'border border-fg-2')} aria-hidden />
            {live ? 'Live' : 'Dry-run'}
          </button>
          <Popover
            align="right"
            width={200}
            trigger={({ open, toggle, id }) => (
              <Button size="sm" variant="secondary" onClick={toggle} aria-expanded={open} aria-controls={open ? id : undefined} icon={<Download size={14} aria-hidden />}>
                Export
              </Button>
            )}
          >
            <div className="-m-1.5 space-y-0.5">
              {[
                { label: 'Download CSV', icon: Sheet, msg: `${title} exported as CSV` },
                { label: 'Download PDF', icon: FileText, msg: `${title} exported as PDF` },
                { label: 'Copy link', icon: Copy, msg: 'Link copied to clipboard' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => {
                    if (o.label === 'Copy link') navigator.clipboard?.writeText(window.location.href).catch(() => {})
                    toast({ tone: 'success', title: o.msg })
                  }}
                  className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-fg hover:bg-surface"
                >
                  <o.icon size={14} aria-hidden className="text-fg-2" />
                  {o.label}
                </button>
              ))}
            </div>
          </Popover>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          {(state.demoState === 'stale' || state.demoState === 'failedRun' || live) && (
            <div className="space-y-2 px-8 pt-6">
              {state.demoState === 'stale' && (
                <Banner
                  tone="warning"
                  title="Data is more than 24 hours old."
                  action={
                    <Button size="sm" variant="secondary" onClick={refresh}>
                      Run analysis now
                    </Button>
                  }
                >
                  The scheduled 06:00 run did not start. Numbers below are from 26h ago.
                </Banner>
              )}
              {state.demoState === 'failedRun' && (
                <Banner
                  tone="error"
                  title="Last run failed at Feature Analysis."
                  action={
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => navigate('/pipeline')}>
                        View pipeline
                      </Button>
                      <Button size="sm" variant="secondary" onClick={refresh}>
                        Retry run
                      </Button>
                    </div>
                  }
                >
                  Showing results from 26h ago. Segments and churn risk are current; feature effects and recommendations are not.
                </Banner>
              )}
              {live && (
                <Banner tone="info" title="Live mode is on.">
                  Approved actions will reach real customers.
                </Banner>
              )}
            </div>
          )}
          <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-6 px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Modal
        open={confirmLive}
        onClose={() => setConfirmLive(false)}
        tone="warning"
        title="Switch to Live mode?"
        description="Approved actions will send real emails and change real prices."
        footer={
          <>
            <Button variant="ghost" data-autofocus onClick={() => setConfirmLive(false)}>
              Stay in Dry-run
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setMode('live')
                setConfirmLive(false)
                toast({ tone: 'info', title: 'Live mode on', body: 'New approvals will reach real customers.' })
              }}
            >
              Switch to Live
            </Button>
          </>
        }
      >
        <p className="flex items-start gap-2 rounded-md border border-risk-med/40 bg-risk-med/10 px-3 py-2 text-sm text-fg">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-risk-med" aria-hidden />
          Every approval from now on is executed for real by the Action agent. Already-queued dry runs are not affected.
        </p>
      </Modal>

      <ToastStack />
    </div>
  )
}
