import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Database,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Settings,
  Sun,
  Users,
  Zap,
} from "lucide-react"
import { segments } from "@/data/mock"
import { currentUser } from "@/data/mock"
import { useApp } from "@/state/AppState"
import { Modal } from "@/components/Overlay"
import ToastStack from "@/components/ToastStack"
import { Banner, Button, Popover, Select, cx } from "@/components/ui"

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Customers", icon: Users },
  {
    to: "/recommendations",
    label: "Recommendations",
    icon: ClipboardCheck,
    badge: true,
  },
  { to: "/activity", label: "Activity", icon: Zap },
]

const titles: [string, string][] = [
  ["/customers", "Customers"],
  ["/recommendations", "Recommendations"],
  ["/activity", "Activity"],
  ["/settings", "Settings"],
  ["/accounts", "Customer Detail"],
  ["/segments", "Segments"],
  ["/churn-risk", "Churn Risk"],
  ["/feature-impact", "Feature Impact"],
  ["/pipeline", "Pipeline"],
]

export default function AppShell() {
  const { state, pendingIds, refresh, setMode, setSegment, setTheme, toast } =
    useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("bi-sidebar") === "collapsed"
    } catch {
      return false
    }
  })
  const [confirmLive, setConfirmLive] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem("bi-sidebar", collapsed ? "collapsed" : "open")
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    document.getElementById("main")?.scrollTo({ top: 0 })
  }, [location.pathname])

  const title =
    location.pathname === "/"
      ? "Overview"
      : (titles.find(([p]) => location.pathname.startsWith(p))?.[1] ??
        "Not found")
  const pending = pendingIds.length
  const live = state.mode === "live"

  useEffect(() => {
    document.title = `${title} · Retention Workspace`
  }, [title])

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>

      {/* Sidebar */}
      <aside
        className={cx(
          "flex shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150",
          collapsed ? "w-[72px]" : "w-[230px]",
        )}
        aria-label="Primary"
      >
        <div
          className={cx(
            "flex h-16 items-center border-b border-line",
            collapsed ? "justify-center" : "gap-3 px-5",
          )}
        >
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent shadow-xs">
            <Activity size={16} strokeWidth={2.25} aria-hidden />
          </span>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-fg">
              Retention Workspace
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
                    aria-label={
                      collapsed
                        ? `${item.label}${
                            item.badge && pending ? `, ${pending} pending` : ""
                          }`
                        : undefined
                    }
                    className={({ isActive }) =>
                      cx(
                        "relative flex h-9 items-center gap-3 rounded-md text-sm font-medium transition-colors",
                        collapsed ? "justify-center" : "px-3",
                        isActive
                          ? "bg-raised text-fg font-semibold"
                          : "text-fg-2 hover:bg-raised/60 hover:text-fg",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r bg-accent"
                            aria-hidden
                          />
                        )}
                        <Icon
                          size={17}
                          strokeWidth={1.75}
                          aria-hidden
                          className={isActive ? "text-accent" : undefined}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {item.badge && pending > 0 && (
                          <span
                            className={cx(
                              "num inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-decision px-1 text-[11px] font-semibold text-on-accent",
                              collapsed && "absolute -top-1 right-1",
                            )}
                            aria-label={
                              collapsed ? undefined : `${pending} pending`
                            }
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
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cx(
              "mb-2 flex h-8 w-full items-center gap-3 rounded-md text-xs text-fg-2 hover:bg-raised hover:text-fg cursor-pointer",
              collapsed ? "justify-center" : "px-3",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen size={15} aria-hidden />
            ) : (
              <PanelLeftClose size={15} aria-hidden />
            )}
            {!collapsed && "Collapse"}
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
                className={cx(
                  "flex w-full items-center gap-3 rounded-md py-1.5 text-left hover:bg-raised cursor-pointer",
                  collapsed ? "justify-center" : "px-2",
                )}
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-fg ring-1 ring-line">
                  {currentUser.initials}
                </span>
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-fg">
                      {currentUser.name}
                    </span>
                    <span className="block truncate text-[11px] text-fg-2">
                      {currentUser.title}
                    </span>
                  </span>
                )}
              </button>
            )}
          >
            <div className="-mt-1 space-y-3" style={{ position: "relative" }}>
              <div className="space-y-0.5 border-b border-line/60 pb-2">
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="flex h-8 w-full items-center gap-2.5 rounded px-2 text-xs font-medium text-fg hover:bg-raised cursor-pointer"
                >
                  <Settings size={14} className="text-fg-2" aria-hidden />
                  Settings & Policy
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pipeline")}
                  className="flex h-8 w-full items-center gap-2.5 rounded px-2 text-xs font-medium text-fg hover:bg-raised cursor-pointer"
                >
                  <Database size={14} className="text-fg-2" aria-hidden />
                  Pipeline & Telemetry
                </button>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-fg">Theme</p>
                <div className="grid grid-cols-2 gap-1 rounded-md bg-surface p-1">
                  {(["dark", "light"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={state.theme === t}
                      onClick={() => setTheme(t)}
                      className={cx(
                        "inline-flex h-7 items-center justify-center gap-1.5 rounded text-xs font-medium capitalize cursor-pointer",
                        state.theme === t
                          ? "bg-raised text-fg ring-1 ring-line font-semibold"
                          : "text-fg-2 hover:text-fg",
                      )}
                    >
                      {t === "dark" ? (
                        <Moon size={12} aria-hidden />
                      ) : (
                        <Sun size={12} aria-hidden />
                      )}
                      {t}
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
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line/60 bg-surface px-8">
          <p className="mr-auto truncate text-sm font-semibold tracking-tight text-fg">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <Select
              label="Segment"
              value={state.segmentFilter}
              onChange={(v) => setSegment(v as typeof state.segmentFilter)}
              options={[
                { value: "all", label: "All segments" },
                ...segments.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
          <span className="h-4 w-px bg-line/60" aria-hidden />
          <div
            className="flex items-center gap-2 text-xs text-fg-2"
            aria-live="polite"
          >
            <span className="size-1.5 rounded-full bg-risk-low" aria-hidden />
            <span className="whitespace-nowrap">
              {state.lastRun.loading ? (
                "Running analysis…"
              ) : (
                <>
                  Updated{" "}
                  <span className="font-medium text-fg">
                    {state.demoState === "stale"
                      ? "26h ago"
                      : state.lastRun.label}
                  </span>
                </>
              )}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Refresh analysis"
              onClick={refresh}
              disabled={state.lastRun.loading}
              icon={
                <RefreshCw
                  size={13}
                  aria-hidden
                  className={state.lastRun.loading ? "animate-spin" : undefined}
                />
              }
            />
          </div>
          <button
            type="button"
            onClick={() => (live ? setMode("dry-run") : setConfirmLive(true))}
            aria-label={`Execution mode: ${
              live ? "Live" : "Dry-run"
            }. Click to switch to ${live ? "Dry-run" : "Live"}.`}
            className={cx(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold cursor-pointer transition-colors",
              live
                ? "border-risk-high/40 bg-risk-high/10 text-risk-high"
                : "border-line bg-raised text-fg-2 hover:text-fg",
            )}
          >
            <span
              className={cx(
                "size-1.5 rounded-full",
                live ? "bg-risk-high" : "bg-fg-2/60",
              )}
              aria-hidden
            />
            {live ? "Live" : "Dry-run"}
          </button>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto outline-none"
        >
          {(state.demoState === "stale" || state.demoState === "failedRun") && (
            <div className="space-y-2 px-8 pt-6">
              {state.demoState === "stale" && (
                <Banner
                  tone="warning"
                  title="Data is more than 24 hours old."
                  action={
                    <Button size="sm" variant="secondary" onClick={refresh}>
                      Run analysis now
                    </Button>
                  }
                >
                  The scheduled 06:00 run did not start. Numbers below are from
                  26h ago.
                </Banner>
              )}
              {state.demoState === "failedRun" && (
                <Banner
                  tone="error"
                  title="Last run failed at Feature Analysis."
                  action={
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate("/pipeline")}
                      >
                        View pipeline
                      </Button>
                      <Button size="sm" variant="secondary" onClick={refresh}>
                        Retry run
                      </Button>
                    </div>
                  }
                >
                  Showing results from 26h ago. Segments and churn risk are
                  current; feature effects and recommendations are not.
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
            <Button
              variant="ghost"
              data-autofocus
              onClick={() => setConfirmLive(false)}
            >
              Stay in Dry-run
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setMode("live")
                setConfirmLive(false)
                toast({
                  tone: "info",
                  title: "Live mode on",
                  body: "New approvals will reach real customers.",
                })
              }}
            >
              Switch to Live
            </Button>
          </>
        }
      >
        <p className="flex items-start gap-2 rounded-md border border-risk-med/40 bg-risk-med/10 px-3 py-2 text-sm text-fg">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-risk-med"
            aria-hidden
          />
          Every approval from now on is executed for real by the Action agent.
          Already-queued dry runs are not affected.
        </p>
      </Modal>

      <ToastStack />
    </div>
  )
}
