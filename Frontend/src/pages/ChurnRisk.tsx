import { useState } from "react"
import { useNavigate } from "react-router"
import { SearchX } from "lucide-react"
import {
  accounts,
  churnReasons,
  expectedCancellations,
  headline,
  levelFor,
  segments,
  survival,
  type Account,
} from "@/data/mock"
import { fmtInt, fmtMoney } from "@/lib/format"
import { useApp } from "@/state/AppState"
import DataTable from "@/components/DataTable"
import { Donut, SurvivalCurve } from "@/components/charts"
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  FilterChip,
  PageHeader,
  RiskBadge,
  SegmentChip,
  Select,
  Skeleton,
  cx,
} from "@/components/ui"

export default function ChurnRisk() {
  const { state, setSegment } = useApp()
  const navigate = useNavigate()
  const loading = state.lastRun.loading
  const [reason, setReason] = useState<"all" | "Dissatisfaction" | "Payment">(
    "all",
  )
  const [level, setLevel] = useState<"all" | "High" | "Medium">("all")
  const [horizonIndex, setHorizonIndex] = useState<number>(2) // default: 90 days

  const currentWindow = expectedCancellations[horizonIndex]
  const rows = accounts.filter(
    (a) =>
      (state.segmentFilter === "all" || a.segment === state.segmentFilter) &&
      (reason === "all" || a.reason === reason) &&
      (level === "all" || levelFor(a.risk) === level),
  )
  const filtered =
    reason !== "all" || level !== "all" || state.segmentFilter !== "all"

  return (
    <>
      <PageHeader
        title="Customer Risk"
        description="Predicted cancellation risk, horizon curves, and customer-level diagnostic drivers."
        right={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/segments")}
          >
            Explore Segments →
          </Button>
        }
      />

      {/* High-signal KPI Tiles */}
      <Card as="div" className="col-span-12 md:col-span-6 p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium tracking-wider text-fg-2 uppercase">
            Expected cancellations
          </p>
          <div className="flex items-center rounded-md border border-line bg-surface p-0.5">
            {expectedCancellations.map((e, idx) => {
              const label = idx === 0 ? "30d" : idx === 1 ? "60d" : "90d"
              const active = horizonIndex === idx
              return (
                <button
                  key={e.window}
                  type="button"
                  onClick={() => setHorizonIndex(idx)}
                  className={cx(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-raised text-fg font-semibold shadow-xs"
                      : "text-fg-2 hover:text-fg",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        {loading ? (
          <Skeleton className="mt-3.5 h-8 w-24" />
        ) : (
          <p className="num mt-2 text-3xl font-medium tracking-tight text-fg">
            {fmtInt(currentWindow.accounts)}
          </p>
        )}
        <p className="mt-1.5 text-xs text-fg-2">
          {((currentWindow.accounts / headline.accounts) * 100).toFixed(1)}% of{" "}
          {fmtInt(headline.accounts)} total accounts
        </p>
      </Card>

      <Card as="div" className="col-span-12 md:col-span-6 p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium tracking-wider text-fg-2 uppercase">
            MRR at risk
          </p>
        </div>
        {loading ? (
          <Skeleton className="mt-3.5 h-8 w-24" />
        ) : (
          <p className="num mt-2 text-3xl font-medium tracking-tight text-risk-high">
            {fmtMoney(headline.mrrAtRisk)}
          </p>
        )}
        <p className="mt-1.5 text-xs text-fg-2">
          {headline.mrrAtRiskShare}% of {fmtMoney(headline.mrr)} total MRR
        </p>
      </Card>

      {/* Customer Survival Curve & Cancellation Drivers */}
      <Card className="col-span-12 lg:col-span-8">
        <CardHeader
          title="Customer Survival Curve"
          subtitle="Retention probability across 90 days"
        />
        <div className="px-6 pb-6">
          {loading ? (
            <Skeleton className="h-[330px]" />
          ) : (
            <SurvivalCurve data={survival} />
          )}
        </div>
      </Card>

      <Card className="col-span-12 lg:col-span-4">
        <CardHeader
          title="Primary Cancellation Drivers"
          subtitle="Distribution by dominant risk signal"
        />
        <div className="px-6 pb-6">
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <Donut
              data={[
                {
                  label: "Dissatisfaction",
                  value: churnReasons[0].share,
                  color: "#EE9B00",
                  detail: churnReasons[0].detail,
                },
                {
                  label: "Payment",
                  value: churnReasons[1].share,
                  color: "#0A9396",
                  detail: churnReasons[1].detail,
                },
              ]}
              center={
                <>
                  <span className="num text-2xl font-medium text-fg">
                    {fmtInt(headline.atRisk)}
                  </span>
                  <span className="text-xs text-fg-2">at-risk accounts</span>
                </>
              }
            />
          )}
        </div>
      </Card>

      {/* At-risk Accounts Table */}
      <Card className="col-span-12">
        <CardHeader
          title="At-risk accounts"
          subtitle={`${rows.length} accounts matching current filters`}
        />
        <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
          <Select
            label="Segment"
            value={state.segmentFilter}
            onChange={(v) => setSegment(v as typeof state.segmentFilter)}
            options={[
              { value: "all", label: "All segments" },
              ...segments.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <span className="mx-1 h-4 w-px bg-line" aria-hidden />
          {(["all", "Dissatisfaction", "Payment"] as const).map((r) => (
            <FilterChip
              key={r}
              active={reason === r}
              onClick={() => setReason(r)}
            >
              {r === "all" ? "All Reasons" : r}
            </FilterChip>
          ))}
          <span className="mx-1 h-4 w-px bg-line" aria-hidden />
          {(["all", "High", "Medium"] as const).map((l) => (
            <FilterChip
              key={l}
              active={level === l}
              onClick={() => setLevel(l)}
            >
              {l === "all" ? "All Risk" : `${l} Risk`}
            </FilterChip>
          ))}
          {filtered && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => {
                setReason("all")
                setLevel("all")
                setSegment("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <DataTable<Account>
          caption="At-risk accounts"
          loading={loading}
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/accounts/${r.id}`)}
          rowLabel={(r) => `Open ${r.name}`}
          defaultSort={{ key: "risk", dir: "desc" }}
          empty={
            <EmptyState
              icon={<SearchX size={18} aria-hidden />}
              title="No accounts match these filters"
              body="Try selecting a different segment or reason."
            />
          }
          columns={[
            {
              key: "name",
              header: "Account",
              render: (r) => (
                <span>
                  <span className="block font-medium text-fg">{r.name}</span>
                  <span className="font-mono text-xs text-fg-2/70">{r.id}</span>
                </span>
              ),
            },
            {
              key: "seg",
              header: "Segment",
              render: (r) => <SegmentChip id={r.segment} />,
            },
            {
              key: "plan",
              header: "Plan",
              render: (r) => <span className="text-fg-2">{r.plan}</span>,
            },
            {
              key: "mrr",
              header: "MRR",
              align: "right",
              sortValue: (r) => r.mrr,
              render: (r) => fmtMoney(r.mrr),
            },
            {
              key: "risk",
              header: "Chance of cancelling",
              sortValue: (r) => r.risk,
              render: (r) => (
                <RiskBadge level={levelFor(r.risk)} value={r.risk} />
              ),
            },
            {
              key: "days",
              header: "Likely within",
              align: "right",
              sortValue: (r) => -r.days,
              render: (r) => (
                <span>
                  ~{r.days}d{" "}
                  <span className="block text-xs text-fg-2/70">
                    {r.daysLo}–{r.daysHi}d
                  </span>
                </span>
              ),
            },
            {
              key: "reason",
              header: "Main reason",
              render: (r) => <span className="text-fg-2">{r.reason}</span>,
            },
            {
              key: "driver",
              header: "Top signal",
              render: (r) => (
                <span className="line-clamp-1 max-w-[260px] text-xs text-fg-2">
                  {r.drivers[0]}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </>
  )
}
