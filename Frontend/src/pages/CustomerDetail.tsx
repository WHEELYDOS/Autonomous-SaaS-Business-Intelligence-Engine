import { Link, useNavigate, useParams } from "react-router"
import {
  ArrowLeft,
  CreditCard,
  LifeBuoy,
  MousePointerClick,
  SearchX,
  Smile,
} from "lucide-react"
import {
  accountById,
  accounts,
  accountSurvival,
  levelFor,
  recommendationById,
  segmentById,
  type TimelineEvent,
} from "@/data/mock"
import { fmtMoney } from "@/lib/format"
import { useApp } from "@/state/AppState"
import { AccountSurvival } from "@/components/charts"
import {
  ActionTypeTag,
  Card,
  CardHeader,
  EmptyState,
  RiskBadge,
  SegmentChip,
  StatusPill,
  cx,
} from "@/components/ui"

const kindIcon: Record<TimelineEvent["kind"], typeof CreditCard> = {
  usage: MousePointerClick,
  payment: CreditCard,
  support: LifeBuoy,
  csat: Smile,
}
const kindLabel: Record<TimelineEvent["kind"], string> = {
  usage: "Usage",
  payment: "Payment",
  support: "Support",
  csat: "CSAT",
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const navigate = useNavigate()
  const a = id ? accountById[id] : undefined

  if (!a) {
    return (
      <Card className="col-span-12">
        <EmptyState
          icon={<SearchX size={18} aria-hidden />}
          title={`We couldn't find account ${id ?? ""}`}
          body="It may have been merged or removed in the latest data sync."
          action={
            <Link
              to="/churn-risk"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Back to Churn Risk
            </Link>
          }
        />
      </Card>
    )
  }

  const seg = segmentById[a.segment]
  const level = levelFor(a.risk)
  const similar = accounts.filter(
    (x) => x.segment === a.segment && x.id !== a.id,
  )
  const touched = state.log.filter((l) => l.segment === a.segment)

  return (
    <>
      {/* Account Masthead */}
      <div className="col-span-12">
        <Link
          to="/churn-risk"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-2 hover:text-fg"
        >
          <ArrowLeft size={13} aria-hidden /> Churn Risk
        </Link>
        <div className="mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line/40 pb-5">
          <div>
            <p className="font-mono text-xs text-fg-2/70">{a.id}</p>
            <h1 className="mt-1 font-editorial text-3xl font-normal tracking-tight text-fg">
              {a.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-fg-2">
              <SegmentChip
                id={a.segment}
                onClick={() => navigate(`/segments?segment=${a.segment}`)}
              />
              <span>{a.plan} plan</span>
              <span aria-hidden className="text-line">
                ·
              </span>
              <span>{a.tenureMonths} mo. customer</span>
              <span aria-hidden className="text-line">
                ·
              </span>
              <span className="num font-semibold text-fg">
                {fmtMoney(a.mrr)} MRR
              </span>
            </div>
          </div>
          <div>
            <RiskBadge
              level={level}
              value={a.risk}
              className="text-xs h-6 px-2.5"
            />
          </div>
        </div>
      </div>

      {/* Diagnostics Dossier */}
      <Card className="col-span-12 lg:col-span-5">
        <CardHeader title="Churn Risk Diagnostic" />
        <div className="space-y-6 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 rounded-md border border-line bg-surface p-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-fg-2">
                Cancellation chance
              </p>
              <p
                className={cx(
                  "num mt-1 text-3xl font-medium tracking-tight",
                  level === "High" ? "text-risk-high" : "text-risk-med",
                )}
              >
                {a.risk}%
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-fg-2">
                Likely timeline
              </p>
              <p className="num mt-1 text-3xl font-medium tracking-tight text-fg">
                ~{a.days}d
              </p>
              <p className="mt-0.5 text-xs text-fg-2/80">
                est. range: {a.daysLo}–{a.daysHi}d
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-fg-2">
              Dominant driver:{" "}
              <strong className="text-fg font-semibold">{a.reason}</strong>
            </p>
            <ul className="mt-2.5 space-y-2">
              {a.drivers.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2.5 text-sm text-fg"
                >
                  <span
                    className="size-1.5 rounded-full bg-accent/60 mt-2 shrink-0"
                    aria-hidden
                  />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="col-span-12 lg:col-span-7">
        <CardHeader
          title="Survival Curve Comparison"
          subtitle={`Account survival trajectory vs. ${seg.name} cohort`}
        />
        <div className="px-6 pb-5">
          <AccountSurvival
            data={accountSurvival(a)}
            color={seg.color}
            segmentName={seg.name}
          />
          <div className="mt-3 flex gap-6 text-xs text-fg-2">
            <span className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-risk-high" aria-hidden /> This
              account
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-0 w-4 border-t-2 border-dashed"
                style={{ borderColor: seg.color }}
                aria-hidden
              />{" "}
              {seg.name} average
            </span>
          </div>
        </div>
      </Card>

      <Card className="col-span-12 lg:col-span-7">
        <CardHeader title="Activity Timeline" />
        <ol className="relative px-6 pb-6">
          {a.timeline.map((e, i) => {
            const Icon = kindIcon[e.kind]
            return (
              <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
                {i < a.timeline.length - 1 && (
                  <span
                    className="absolute top-8 bottom-0 left-[15px] w-px bg-line/60"
                    aria-hidden
                  />
                )}
                <span
                  className={cx(
                    "relative inline-flex size-8 shrink-0 items-center justify-center rounded-full border",
                    e.tone === "bad"
                      ? "border-risk-high/30 bg-risk-high/10 text-risk-high"
                      : e.tone === "good"
                        ? "border-risk-low/30 bg-risk-low/10 text-risk-low"
                        : "border-line bg-surface text-fg-2",
                  )}
                >
                  <Icon size={13} aria-hidden />
                </span>
                <div className="pt-1">
                  <p className="text-sm font-medium text-fg">{e.text}</p>
                  <p className="text-xs text-fg-2/70 mt-0.5">
                    {kindLabel[e.kind]} · {e.date}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="col-span-12 lg:col-span-5 space-y-6">
        <Card>
          <CardHeader title="Related recommendations" />
          <ul className="space-y-2.5 px-6 pb-6">
            {a.recs.map((rid) => {
              const r = recommendationById[rid]
              const st = state.recs[rid].status
              return (
                <li key={rid}>
                  <Link
                    to={`/recommendations?tab=${st}&expand=${rid}`}
                    className="block rounded-md border border-line p-3 hover:border-line-strong transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-fg-2/70">
                        {rid}
                      </span>
                      <ActionTypeTag type={r.type} />
                      <StatusPill
                        status={
                          st === "pending"
                            ? "Pending"
                            : st === "approved"
                              ? "Approved"
                              : "Rejected"
                        }
                      />
                    </span>
                    <span className="mt-2 block text-sm font-medium text-fg">
                      {r.title}
                    </span>
                  </Link>
                </li>
              )
            })}
            {touched.slice(0, 2).map((l) => (
              <li key={l.id} className="rounded-md border border-line p-3">
                <span className="flex items-center gap-2">
                  <ActionTypeTag type={l.type} />
                  <StatusPill status={l.status} />
                  <span className="ml-auto text-xs text-fg-2">{l.time}</span>
                </span>
                <span className="mt-2 block text-sm font-medium text-fg">
                  {l.recommendation}
                </span>
              </li>
            ))}
            {!a.recs.length && !touched.length && (
              <li className="text-sm text-fg-2">
                No recommendations or actions yet.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Similar accounts"
            subtitle={`Other at-risk ${seg.name} accounts`}
          />
          <ul className="px-3 pb-3">
            {similar.length ? (
              similar.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/accounts/${s.id}`}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-raised/40 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {s.name}
                      </span>
                      <span className="font-mono text-xs text-fg-2/70">
                        {s.id}
                      </span>
                    </span>
                    <RiskBadge level={levelFor(s.risk)} value={s.risk} />
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-fg-2">
                No other at-risk accounts from this segment in the sample.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  )
}
