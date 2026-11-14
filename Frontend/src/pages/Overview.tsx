import { useNavigate, Link } from "react-router"
import {
  ArrowRight,
  CheckCircle2,
  PartyPopper,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  XCircle,
  Zap,
} from "lucide-react"
import {
  anomalies,
  headline,
  kpiTrends,
  recommendationById,
  riskDistribution,
  segments,
  type ActionLogRow,
} from "@/data/mock"
import { fmtInt, fmtMoney } from "@/lib/format"
import { useApp } from "@/state/AppState"
import KpiCard from "@/components/KpiCard"
import RecommendationCard from "@/components/RecommendationCard"
import DataTable from "@/components/DataTable"
import { RiskDistribution, SegmentHealthBars } from "@/components/charts"
import {
  ActionTypeTag,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  SegmentChip,
  Skeleton,
  StatusPill,
  cx,
} from "@/components/ui"

export default function Overview() {
  const { state, pendingIds, retry } = useApp()
  const navigate = useNavigate()
  const loading = state.lastRun.loading
  const top = pendingIds
    .map((id) => recommendationById[id])
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => b.mrrRetained - a.mrrRetained)
    .slice(0, 3)

  return (
    <div className="col-span-12 space-y-8 anim-fade-in">
      <PageHeader
        title="Overview"
        description="Daily retention briefing, high-impact decisions, and early intervention telemetry."
      />

      {/* Executive Intelligence Briefing Strip */}
      <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <h2 className="font-editorial text-2xl font-normal tracking-tight text-fg">
              {pendingIds.length > 0
                ? `${pendingIds.length} high-impact retention actions ready for execution`
                : "All retention recommendations processed and up to date"}
            </h2>
            <p className="text-xs md:text-sm text-fg-2 leading-relaxed">
              Growing cancellation risk identified in{" "}
              <strong className="text-fg font-medium">SMB</strong> and{" "}
              <strong className="text-fg font-medium">Starters</strong> tiers.
              Acting on pending recommendations could protect up to{" "}
              <strong className="text-editorial font-serif font-medium">
                $24,800/mo
              </strong>{" "}
              in recurring revenue.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {pendingIds.length > 0 && (
              <Button
                variant="decision"
                size="md"
                onClick={() => navigate("/recommendations?tab=pending")}
                icon={<Zap size={14} />}
                className="font-medium"
              >
                Review Actions ({pendingIds.length})
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/customers")}
              icon={<ShieldAlert size={14} className="text-risk-high" />}
            >
              At-risk customers
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Airy 4-Card Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          loading={loading}
          label="Total MRR"
          value={fmtMoney(headline.mrr)}
          delta="+1.8%"
          good
          series={kpiTrends.mrr.series}
        />
        <KpiCard
          loading={loading}
          label="MRR at risk"
          value={fmtMoney(headline.mrrAtRisk)}
          delta="+4.9%"
          good={false}
          series={kpiTrends.mrrAtRisk.series}
        />
        <KpiCard
          loading={loading}
          label="90-day churn"
          value={`${headline.churn90}%`}
          delta="+0.3 pts"
          good={false}
          series={kpiTrends.churn.series}
        />
        <KpiCard
          loading={loading}
          tone="decision"
          label="Pending approvals"
          value={pendingIds.length}
          sub={
            pendingIds.length
              ? "Recommendations awaiting sign-off"
              : "All caught up"
          }
          to={pendingIds.length ? "/recommendations?tab=pending" : undefined}
        />
      </div>

      {/* Main Grid: Decisions + Analytics */}
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader
            title="Needs your decision"
            subtitle="Top pending recommendations ranked by revenue impact"
            right={
              pendingIds.length > 0 && (
                <Link
                  to="/recommendations?tab=pending"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  See all {pendingIds.length}{" "}
                  <ArrowRight size={12} aria-hidden />
                </Link>
              )
            }
          />
          <div className="space-y-3 px-6 pb-6">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-[88px]" />)
            ) : top.length ? (
              top.map((r) => <RecommendationCard key={r.id} rec={r} compact />)
            ) : (
              <EmptyState
                icon={<PartyPopper size={18} aria-hidden />}
                title="No pending recommendations — you're all caught up"
                body="The next analysis run is scheduled for 06:00 tomorrow. New recommendations will appear here."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate("/activity")}
                  >
                    See what's running
                  </Button>
                }
              />
            )}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader
            title="Risk distribution"
            subtitle="Accounts grouped by 90-day cancellation probability"
          />
          <div className="px-6 pb-6">
            {loading ? (
              <Skeleton className="h-52" />
            ) : (
              <RiskDistribution data={riskDistribution} />
            )}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <CardHeader
            title="Segment health"
            subtitle="At-risk account volume by customer tier"
          />
          <div className="px-4 pb-4">
            {loading ? (
              <Skeleton className="mx-2 h-48" />
            ) : (
              <SegmentHealthBars
                data={[...segments].sort((a, b) => b.atRisk - a.atRisk)}
                onSelect={(id) => navigate(`/segments?segment=${id}`)}
              />
            )}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <CardHeader
            title="Anomaly alerts"
            subtitle="Unusual signals spotted in the latest analysis"
          />
          <ul className="px-6 pb-5">
            {anomalies.map((a) => {
              const logRow = a.retryActionId
                ? state.log.find((l) => l.id === a.retryActionId)
                : undefined
              const resolved = logRow && logRow.status === "Executed"
              const icon =
                a.tone === "good" || resolved ? (
                  <TrendingUp size={14} className="text-risk-low" />
                ) : a.tone === "failed" ? (
                  <XCircle size={14} className="text-risk-high" />
                ) : a.tone === "warn" ? (
                  <TriangleAlert size={14} className="text-risk-med" />
                ) : (
                  <TrendingDown size={14} className="text-risk-high" />
                )
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 border-b border-line/40 py-3.5 last:border-0"
                >
                  <span
                    className={cx(
                      "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-raised",
                    )}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">
                      {resolved
                        ? "Win-back offer resent successfully"
                        : a.title}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-2">
                      {resolved
                        ? "210 accounts reached after retry."
                        : a.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-fg-2">{a.when}</span>
                    {logRow ? (
                      logRow.status === "Failed" ? (
                        <button
                          type="button"
                          onClick={() => retry(logRow.id)}
                          className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                        >
                          Retry
                        </button>
                      ) : logRow.status === "Running" ? (
                        <span className="text-xs text-fg-2">Retrying…</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-risk-low">
                          <CheckCircle2 size={12} aria-hidden /> Resolved
                        </span>
                      )
                    ) : (
                      a.link && (
                        <Link
                          to={a.link.to}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          {a.link.label}
                        </Link>
                      )
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="col-span-12">
          <CardHeader
            title="Recent actions"
            right={
              <Link
                to="/activity"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Open execution log <ArrowRight size={12} aria-hidden />
              </Link>
            }
          />
          <div className="pb-2">
            <DataTable<ActionLogRow>
              caption="Recent actions"
              loading={loading}
              rows={state.log.slice(0, 6)}
              rowKey={(r) => r.id}
              onRowClick={() => navigate("/activity")}
              rowLabel={(r) =>
                `${r.recommendation}, ${r.status}. Open execution log.`
              }
              columns={[
                {
                  key: "time",
                  header: "When",
                  render: (r) => <span className="text-fg-2">{r.time}</span>,
                  width: "120px",
                },
                {
                  key: "rec",
                  header: "Action",
                  render: (r) => (
                    <span className="font-medium">{r.recommendation}</span>
                  ),
                },
                {
                  key: "seg",
                  header: "Segment",
                  render: (r) => <SegmentChip id={r.segment} />,
                },
                {
                  key: "type",
                  header: "Type",
                  render: (r) => <ActionTypeTag type={r.type} />,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusPill status={r.status} />,
                },
                {
                  key: "acc",
                  header: "Accounts",
                  align: "right",
                  render: (r) => fmtInt(r.accounts),
                },
                {
                  key: "result",
                  header: "Early result",
                  render: (r) => (
                    <span
                      className={cx(
                        "text-xs",
                        r.status === "Failed" ? "text-risk-high" : "text-fg-2",
                      )}
                    >
                      {r.error ?? r.result}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
