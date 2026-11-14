import type { ReactNode } from "react"
import { Link } from "react-router"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Sparkline } from "./charts"
import { Card, Skeleton, cx } from "./ui"

export default function KpiCard({
  label,
  value,
  sub,
  delta,
  good,
  series,
  how: _how,
  tone,
  to,
  loading,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  delta?: string
  good?: boolean
  series?: number[]
  how?: ReactNode
  tone?: "decision"
  to?: string
  loading?: boolean
}) {
  const up = delta?.startsWith("+")
  const isDecision = tone === "decision"

  const card = (
    <Card
      as="div"
      className={cx(
        "group relative flex flex-col p-6 h-full transition-all duration-200",
        isDecision
          ? "border-decision/40 bg-decision/[0.04] hover:border-decision/70"
          : "hover:border-line-strong",
        to && "cursor-pointer hover:shadow-xs",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cx(
            "text-[11px] font-medium tracking-wider uppercase",
            isDecision ? "text-decision" : "text-fg-2",
          )}
        >
          {label}
        </p>
      </div>

      {loading ? (
        <>
          <Skeleton className="mt-4 h-9 w-28" />
          <Skeleton className="mt-3 h-4 w-32" />
        </>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p
              className={cx(
                "num text-3xl font-medium tracking-tight",
                isDecision ? "text-decision" : "text-fg",
              )}
            >
              {value}
            </p>
            {series && (
              <div className="opacity-75 transition-opacity group-hover:opacity-100">
                <Sparkline
                  data={series}
                  width={72}
                  height={24}
                  color={
                    good === undefined
                      ? "var(--text-2)"
                      : good
                        ? "var(--risk-low)"
                        : "var(--risk-high)"
                  }
                  label={`${label} trend over 12 weeks`}
                />
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-fg-2">
            {delta ? (
              <span
                className={cx(
                  "num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                  good
                    ? "bg-risk-low/10 text-risk-low border-risk-low/20"
                    : "bg-risk-high/10 text-risk-high border-risk-high/20",
                )}
              >
                {up ? (
                  <ArrowUpRight size={11} strokeWidth={2.5} aria-hidden />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={2.5} aria-hidden />
                )}
                {delta}
              </span>
            ) : (
              sub
            )}
          </div>
        </>
      )}
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="block col-span-1 focus:outline-none">
        {card}
      </Link>
    )
  }

  return <div className="col-span-1 h-full">{card}</div>
}
