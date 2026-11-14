import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  CircleHelp,
  Clock,
  Info,
  Loader2,
  Mail,
  MousePointerClick,
  Split,
  Tag,
  X,
  XCircle,
  CircleAlert,
  Play,
} from "lucide-react"
import type { ActionType, Confidence, RiskLevel, SegmentId } from "@/data/mock"
import { segmentById } from "@/data/mock"

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

/* Button ----------------------------------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "decision"
  size?: "sm" | "md"
  icon?: ReactNode
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        !children && (size === "sm" ? "w-8 px-0" : "w-9 px-0"),
        variant === "primary" &&
          "bg-accent text-on-accent hover:bg-accent-strong font-semibold shadow-xs",
        variant === "decision" &&
          "bg-decision text-on-accent hover:brightness-110 font-semibold shadow-xs",
        variant === "secondary" &&
          "border border-line bg-surface hover:bg-raised text-fg hover:border-line-strong hover:shadow-xs",
        variant === "ghost" && "text-fg-2 hover:bg-raised hover:text-fg",
        variant === "danger" &&
          "border border-risk-high/40 bg-risk-high/15 text-risk-high hover:bg-risk-high/25",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/* Card ------------------------------------------------------------- */

export function Card({
  className,
  children,
  as: As = "section",
  interactive = true,
  ...rest
}: {
  className?: string
  children: ReactNode
  as?: "section" | "div" | "article"
  "aria-label"?: string
  interactive?: boolean
}) {
  return (
    <As
      {...rest}
      className={cx(
        "saas-card rounded-card overflow-hidden",
        interactive && "saas-card-interactive",
        className,
      )}
    >
      {children}
    </As>
  )
}

export function CardHeader({
  title,
  subtitle,
  how,
  right,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  how?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        "flex items-start justify-between gap-4 px-6 pt-6 pb-2",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-fg tracking-tight">
            {title}
          </h2>
          {how && (
            <HowCalculated label={typeof title === "string" ? title : "this"}>
              {how}
            </HowCalculated>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-fg-2">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

/* Popover / HowCalculated ------------------------------------------ */

export function Popover({
  trigger,
  children,
  align = "left",
  width = 280,
  side = "bottom",
}: {
  trigger: (p: { open: boolean toggle: () => void id: string }) => ReactNode
  children: ReactNode
  align?: "left" | "right"
  width?: number
  side?: "bottom" | "top"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])
  return (
    <span ref={ref} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <span
          id={id}
          role="dialog"
          style={{ width }}
          className={cx(
            "anim-pop absolute z-40 rounded-md border border-line bg-raised p-3 text-left text-xs leading-5 font-normal text-fg-2 shadow-[var(--shadow)]",
            align === "right" ? "right-0" : "left-0",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {children}
        </span>
      )}
    </span>
  )
}

export function HowCalculated({
  label,
  children,
  align,
}: {
  label: string
  children: ReactNode
  align?: "left" | "right"
}) {
  return (
    <Popover
      align={align}
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-label={`How is ${label} calculated?`}
          className="inline-flex size-5 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-fg"
        >
          <CircleHelp size={13} strokeWidth={1.75} />
        </button>
      )}
    >
      <span className="mb-1 block font-semibold text-fg">
        How this is calculated
      </span>
      {children}
    </Popover>
  )
}

/* Badges ----------------------------------------------------------- */

const riskStyles: Record<RiskLevel, string> = {
  High: "text-risk-high bg-risk-high/10 border-risk-high/25",
  Medium: "text-risk-med bg-risk-med/10 border-risk-med/25",
  Low: "text-risk-low bg-risk-low/10 border-risk-low/25",
}

export function RiskIcon({
  level,
  size = 11,
}: {
  level: RiskLevel
  size?: number
}) {
  if (level === "High")
    return <AlertTriangle size={size} strokeWidth={2} aria-hidden />
  if (level === "Medium")
    return <CircleAlert size={size} strokeWidth={2} aria-hidden />
  return <CheckCircle2 size={size} strokeWidth={2} aria-hidden />
}

export function RiskBadge({
  level,
  value,
  className,
}: {
  level: RiskLevel
  value?: number
  className?: string
}) {
  return (
    <span
      className={cx(
        "num inline-flex h-5 items-center gap-1 rounded-md border px-2 text-[11px] font-medium whitespace-nowrap",
        riskStyles[level],
        className,
      )}
    >
      <RiskIcon level={level} />
      {level}
      {value !== undefined && <span className="opacity-90">· {value}%</span>}
    </span>
  )
}

export type Status = "Pending" | "Approved" | "Rejected" | "Executed" | "Failed" | "Dry-run" | "Queued" | "Running" | "OK" | "Warning" | "Edited"

const statusMap: Record<Status, { cls: string icon: ReactNode }> = {
  Pending: {
    cls: "text-decision bg-decision/10 border-decision/25",
    icon: <Clock size={11} strokeWidth={2} />,
  },
  Approved: {
    cls: "text-accent bg-accent/10 border-accent/25",
    icon: <Check size={11} strokeWidth={2.25} />,
  },
  Rejected: {
    cls: "text-fg-2 bg-surface border-line",
    icon: <X size={11} strokeWidth={2.25} />,
  },
  Executed: {
    cls: "text-risk-low bg-risk-low/10 border-risk-low/25",
    icon: <CheckCircle2 size={11} strokeWidth={2} />,
  },
  Failed: {
    cls: "text-risk-high bg-risk-high/10 border-risk-high/25",
    icon: <XCircle size={11} strokeWidth={2} />,
  },
  "Dry-run": {
    cls: "text-fg-2 bg-surface border-line border-dashed",
    icon: <CircleDot size={11} strokeWidth={2} />,
  },
  Queued: {
    cls: "text-accent bg-accent/10 border-accent/20",
    icon: <Clock size={11} strokeWidth={2} />,
  },
  Running: {
    cls: "text-accent bg-accent/10 border-accent/20",
    icon: <Loader2 size={11} strokeWidth={2} className="animate-spin" />,
  },
  OK: {
    cls: "text-risk-low bg-risk-low/10 border-risk-low/25",
    icon: <CheckCircle2 size={11} strokeWidth={2} />,
  },
  Warning: {
    cls: "text-risk-med bg-risk-med/10 border-risk-med/25",
    icon: <AlertTriangle size={11} strokeWidth={2} />,
  },
  Edited: {
    cls: "text-fg-2 bg-surface border-line",
    icon: <Info size={11} strokeWidth={2} />,
  },
}

export function StatusPill({
  status,
  label,
}: {
  status: Status
  label?: string
}) {
  const s = statusMap[status]
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center gap-1 rounded-md border px-2 text-[11px] font-medium whitespace-nowrap",
        s.cls,
      )}
    >
      <span aria-hidden className="inline-flex">
        {s.icon}
      </span>
      {label ?? status}
    </span>
  )
}

const confHelp: Record<Confidence, string> = {
  High: "Strong evidence: narrow effect range, well above zero.",
  Medium: "Moderate evidence: wide effect range.",
  Low: "Weak evidence: effect range includes zero.",
}

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span
      title={confHelp[level]}
      className={cx(
        "inline-flex h-5 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium whitespace-nowrap",
        level === "Low"
          ? "border-risk-med/30 bg-risk-med/10 text-risk-med"
          : level === "High"
            ? "border-risk-low/30 bg-risk-low/10 text-risk-low"
            : "border-line bg-surface text-fg-2",
      )}
    >
      <span
        className={cx(
          "size-1.5 rounded-full",
          level === "Low"
            ? "bg-risk-med"
            : level === "High"
              ? "bg-risk-low"
              : "bg-fg-2/60",
        )}
        aria-hidden
      />
      {level}
    </span>
  )
}

const typeIcon: Record<ActionType, ReactNode> = {
  "UI guide": <MousePointerClick size={11} strokeWidth={2} />,
  "Targeted email": <Mail size={11} strokeWidth={2} />,
  "A/B test": <Split size={11} strokeWidth={2} />,
  "Pricing change": <Tag size={11} strokeWidth={2} />,
}

export function ActionTypeTag({ type }: { type: ActionType | string }) {
  const icon =
    type in typeIcon ? (
      typeIcon[(type as ActionType)]
    ) : (
      <Tag size={11} strokeWidth={2} />
    )
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[11px] font-medium whitespace-nowrap text-fg-2">
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
      {type}
    </span>
  )
}

export function SegmentDot({
  id,
  size = 7,
}: {
  id: SegmentId | string | number | null
  size?: number
}) {
  const seg =
    typeof id === "string" && id in segmentById
      ? segmentById[(id as SegmentId)]
      : undefined
  const color = seg?.color ?? "var(--muted)"
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color }}
    />
  )
}

export function SegmentChip({
  id,
  onClick,
}: {
  id: SegmentId | string | number | null
  onClick?: () => void
}) {
  const seg =
    typeof id === "string" && id in segmentById
      ? segmentById[(id as SegmentId)]
      : undefined
  const name = seg?.name ?? (id ? String(id) : "Unknown")
  const inner = (
    <>
      <SegmentDot id={id} />
      {name}
    </>
  )
  const cls =
    "inline-flex h-5 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-[11px] font-medium whitespace-nowrap text-fg"
  if (onClick)
    return (
      <button
        type="button"
        onClick={onClick}
        className={cx(cls, "hover:border-line-strong")}
      >
        {inner}
      </button>
    )
  return <span className={cls}>{inner}</span>
}

export function AgentChip({
  name,
  status = "Completed 2h ago",
}: {
  name: string
  status?: string
}) {
  const isRunning = status.toLowerCase().includes("running")
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-line bg-surface/80 px-2.5 text-xs text-fg-2 backdrop-blur-xs">
      <span
        aria-hidden
        className={cx(
          "size-1.5 rounded-full",
          isRunning ? "bg-accent animate-pulse" : "bg-risk-low",
        )}
      />
      <span className="font-medium text-fg">{name}</span>
      <span className="text-[11px] text-fg-2/70">· {status}</span>
    </span>
  )
}

/* Tabs ------------------------------------------------------------- */

export type TabDef = {
  id: string
  label: string
  count?: number
  countTone?: "decision" | "neutral"
  disabled?: boolean
  hint?: string
}

export function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: TabDef[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const enabled = tabs.filter((t) => !t.disabled)
  const onKey = (e: KeyboardEvent) => {
    const idx = enabled.findIndex((t) => t.id === value)
    let next = -1
    if (e.key === "ArrowRight") next = (idx + 1) % enabled.length
    if (e.key === "ArrowLeft")
      next = (idx - 1 + enabled.length) % enabled.length
    if (e.key === "Home") next = 0
    if (e.key === "End") next = enabled.length - 1
    if (next >= 0) {
      e.preventDefault()
      onChange(enabled[next].id)
      refs.current[enabled[next].id]?.focus()
    }
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKey}
      className="flex items-center gap-1 border-b border-line"
    >
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el
            }}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            disabled={t.disabled}
            title={t.hint}
            onClick={() => onChange(t.id)}
            className={cx(
              "-mb-px inline-flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              active
                ? "border-accent text-fg"
                : "border-transparent text-fg-2 hover:text-fg",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cx(
                  "num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  t.countTone === "decision" && t.count > 0
                    ? "bg-decision text-on-accent"
                    : "bg-raised text-fg-2",
                )}
              >
                {t.count}
              </span>
            )}
            {t.hint && t.disabled && (
              <span className="text-xs font-normal text-muted">{t.hint}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* Accordion -------------------------------------------------------- */

export function Accordion({
  title,
  children,
  defaultOpen = false,
  className,
  subtitle,
}: {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  subtitle?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  useEffect(() => setOpen(defaultOpen), [defaultOpen])
  return (
    <div
      className={cx("rounded-card border border-line bg-surface", className)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-card px-5 py-4 text-left hover:bg-raised/40 cursor-pointer"
      >
        <span>
          <span className="block text-sm font-semibold text-fg">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block text-xs text-fg-2">{subtitle}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cx(
            "shrink-0 text-fg-2 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={id} className="border-t border-line px-5 py-4">
          {children}
        </div>
      )}
    </div>
  )
}

/* Switch ----------------------------------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  description,
}: {
  checked: boolean
  onChange?: (v: boolean) => void
  label: string
  disabled?: boolean
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={description}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed cursor-pointer",
        checked ? "border-accent bg-accent" : "border-line-strong bg-raised",
        disabled && "opacity-70",
      )}
    >
      <span
        className={cx(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  )
}

/* Select ----------------------------------------------------------- */

export function Select({
  value,
  onChange,
  options,
  label,
  className,
  hideLabel = true,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string label: string }[]
  label: string
  className?: string
  hideLabel?: boolean
}) {
  const id = useId()
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "text-xs text-fg-2"}
      >
        {label}
      </label>
      <span className="relative inline-flex">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 appearance-none rounded-md border border-line bg-surface pr-8 pl-3 text-xs font-medium text-fg hover:border-line-strong cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-2"
        />
      </span>
    </span>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors cursor-pointer",
        active
          ? "border-accent/50 bg-accent/12 text-fg font-semibold"
          : "border-line bg-surface text-fg-2 hover:text-fg",
      )}
    >
      {children}
    </button>
  )
}

/* Skeleton, empty, banners ------------------------------------------ */

export function Skeleton({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      aria-hidden
      className={cx("skeleton block", className)}
      style={style}
    />
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && (
        <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-raised text-fg-2">
          {icon}
        </span>
      )}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {body && <p className="max-w-sm text-xs text-fg-2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Banner({
  tone,
  title,
  children,
  action,
}: {
  tone: "info" | "warning" | "error"
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const styles = {
    info: "border-accent/25 bg-accent/6 text-accent",
    warning: "border-risk-med/30 bg-risk-med/6 text-risk-med",
    error: "border-risk-high/30 bg-risk-high/6 text-risk-high",
  }[tone]
  const icon =
    tone === "info" ? (
      <Info size={15} />
    ) : tone === "warning" ? (
      <AlertTriangle size={15} />
    ) : (
      <XCircle size={15} />
    )
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-center gap-3 rounded-md border px-4 py-2 text-xs md:text-sm",
        styles,
      )}
    >
      <span aria-hidden className="inline-flex shrink-0">
        {icon}
      </span>
      <p className="flex-1 text-fg">
        <span className="font-semibold">{title}</span>
        {children && <span className="text-fg-2"> {children}</span>}
      </p>
      {action}
    </div>
  )
}

/* Page header ------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  agent,
  agentStatus,
  right,
}: {
  title: string
  description: string
  agent?: string
  agentStatus?: string
  right?: ReactNode
}) {
  return (
    <div className="col-span-12 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
      <div>
        <h1 className="font-editorial text-3xl font-normal tracking-tight text-fg">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-xs md:text-sm text-fg-2 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {agent && <AgentChip name={agent} status={agentStatus} />}
        {right}
      </div>
    </div>
  )
}

export function StatTile({
  label,
  value,
  sub,
  how: _how,
  tone,
  loading,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  how?: ReactNode
  tone?: "high" | "decision"
  loading?: boolean
  className?: string
}) {
  return (
    <Card
      as="div"
      className={cx("col-span-12 sm:col-span-6 lg:col-span-3 p-6", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wider text-fg-2 uppercase">
          {label}
        </p>
      </div>
      {loading ? (
        <Skeleton className="mt-3.5 h-8 w-24" />
      ) : (
        <p
          className={cx(
            "num mt-2 text-3xl font-medium tracking-tight",
            tone === "high"
              ? "text-risk-high"
              : tone === "decision"
                ? "text-decision"
                : "text-fg",
          )}
        >
          {value}
        </p>
      )}
      {sub && <p className="mt-1.5 text-xs text-fg-2">{sub}</p>}
    </Card>
  )
}

export function ExecuteIcon() {
  return <Play size={14} aria-hidden />
}
