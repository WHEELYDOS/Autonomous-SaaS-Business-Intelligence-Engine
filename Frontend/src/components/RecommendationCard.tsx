import { useEffect, useId, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Pencil,
  X,
} from "lucide-react"
import type { Recommendation } from "@/data/mock"
import { fmtInt, fmtMoney, fmtPts, fmtRange } from "@/lib/format"
import { useApp } from "@/state/AppState"
import ActionPreview from "./ActionPreview"
import { Modal } from "./Overlay"
import {
  ActionTypeTag,
  Button,
  Card,
  ConfidenceBadge,
  SegmentChip,
  StatusPill,
  cx,
} from "./ui"

const rejectPresets = [
  "Not now",
  "Disagree with the evidence",
  "Overlaps another action",
  "Other",
]

function Metric({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  const isRevenue = label.toLowerCase().includes("mrr")
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-fg-2">
        {label}
      </p>
      <p
        className={cx(
          "num mt-1 text-2xl font-medium tracking-tight",
          isRevenue ? "text-editorial" : "text-fg",
        )}
      >
        {value}
      </p>
      {sub && <p className="num text-xs text-fg-2/80 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function RecommendationCard({
  rec,
  expanded = false,
  compact = false,
}: {
  rec: Recommendation
  expanded?: boolean
  compact?: boolean
}) {
  const { state, approve, reject, edit, toast } = useApp()
  const navigate = useNavigate()
  const rs = state.recs[rec.id]
  const accounts = rs?.edited?.accounts ?? rec.accounts
  const sendTime = rs?.edited?.sendTime ?? rec.sendTime
  const [open, setOpen] = useState(expanded)
  const [modal, setModal] = useState<"approve" | "reject" | "edit" | null>(null)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [editAccounts, setEditAccounts] = useState(accounts)
  const [editTime, setEditTime] = useState(sendTime ?? "")
  const evidenceId = useId()
  const live = state.mode === "live"

  useEffect(() => setOpen(expanded), [expanded])

  const mrr = Math.round((rec.mrrRetained * accounts) / rec.accounts)

  const doApprove = () => {
    approve(rec.id)
    setModal(null)
    toast({
      tone: "success",
      title: live
        ? "Approved — queued for live execution"
        : "Approved — queued as Dry-run",
      body: `${rec.title} · ${fmtInt(accounts)} accounts`,
      action: { label: "View in log", to: "/actions" },
    })
  }

  const doReject = () => {
    const r =
      reason === "Other"
        ? note.trim() || "Other"
        : note.trim()
          ? `${reason}: ${note.trim()}`
          : reason
    reject(rec.id, r)
    setModal(null)
    toast({
      tone: "info",
      title: "Recommendation rejected",
      body: `${rec.title}. The Strategy agent will use your reason next run.`,
      action: { label: "View rejected", to: "/recommendations?tab=rejected" },
    })
  }

  const doEdit = () => {
    const n = Math.max(
      1,
      Math.min(rec.accounts, Math.round(editAccounts) || rec.accounts),
    )
    edit(rec.id, n, rec.sendTime ? editTime : undefined)
    setModal(null)
    toast({
      tone: "success",
      title: "Changes saved",
      body: `Audience set to ${fmtInt(n)} accounts.`,
    })
  }

  const chips = (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentChip id={rec.segment} />
      <ActionTypeTag type={rec.type} />
      {rec.confidence === "Low" && <ConfidenceBadge level="Low" />}
      {rs.status === "approved" && <StatusPill status="Approved" />}
      {rs.status === "rejected" && <StatusPill status="Rejected" />}
      {rs.edited && <StatusPill status="Edited" />}
    </div>
  )

  if (compact) {
    return (
      <Card
        as="article"
        className="flex items-center gap-5 p-5 hover:border-line-strong bg-surface transition-all duration-150"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-fg-2">
            <span className="font-mono text-xs text-fg-2/70">{rec.id}</span>
            <span aria-hidden className="text-line">
              ·
            </span>
            <SegmentChip id={rec.segment} />
            <ActionTypeTag type={rec.type} />
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-fg tracking-tight">
            {rec.title}
          </h3>
          <p className="num mt-1 text-xs text-fg-2">
            {fmtInt(accounts)} accounts · retention effect{" "}
            <span className="font-medium text-risk-low">
              {fmtPts(rec.lift)}
            </span>{" "}
            ({fmtRange(rec.lo, rec.hi)})
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-fg-2 uppercase tracking-wider">
            Est. MRR Retained
          </p>
          <p className="num text-2xl font-medium text-editorial tracking-tight">
            {fmtMoney(mrr)}
          </p>
        </div>
        <Button
          variant="decision"
          size="sm"
          onClick={() =>
            navigate(`/recommendations?tab=pending&expand=${rec.id}`)
          }
        >
          Review <ArrowRight size={13} aria-hidden />
        </Button>
      </Card>
    )
  }

  return (
    <Card
      as="article"
      aria-label={rec.title}
      className={cx(
        "relative overflow-hidden",
        rs.status === "pending" && "border-line",
      )}
    >
      {rec.lowConfidence && rs.status === "pending" && (
        <span
          className="absolute top-0 bottom-0 left-0 w-1 bg-risk-med"
          aria-hidden
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {chips}
          <span className="font-mono text-xs text-fg-2/70">{rec.id}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold text-fg tracking-tight">
          {rec.title}
        </h3>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-fg-2">
          {rec.narrative}
        </p>

        {rec.lowConfidence && rs.status === "pending" && (
          <p className="mt-3 flex items-start gap-2 rounded-md border border-risk-med/30 bg-risk-med/8 px-3 py-2 text-xs text-fg">
            <AlertTriangle
              size={14}
              className="mt-0.5 shrink-0 text-risk-med"
              aria-hidden
            />
            {rec.lowConfidence}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-6 rounded-md border border-line bg-surface/50 px-5 py-4">
          <Metric
            label="Accounts targeted"
            value={fmtInt(accounts)}
            sub={rs.edited ? `of ${fmtInt(rec.accounts)} suggested` : undefined}
          />
          <Metric label="Est. MRR retained (90d)" value={fmtMoney(mrr)} />
          <Metric
            label="Effect on retention"
            value={fmtPts(rec.lift)}
            sub={`Likely range ${fmtRange(rec.lo, rec.hi)}`}
          />
        </div>

        {rs.status === "pending" && (
          <div className="mt-5 flex items-center gap-2.5">
            <Button
              variant="primary"
              icon={<Check size={15} aria-hidden />}
              onClick={() => setModal("approve")}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              icon={<X size={15} aria-hidden />}
              onClick={() => setModal("reject")}
            >
              Reject
            </Button>
            <Button
              variant="ghost"
              icon={<Pencil size={13} aria-hidden />}
              onClick={() => {
                setEditAccounts(accounts)
                setEditTime(sendTime ?? "")
                setModal("edit")
              }}
            >
              Edit
            </Button>
          </div>
        )}
        {rs.status === "approved" && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-accent/25 bg-accent/8 px-4 py-2.5 text-xs text-fg">
            <Check size={14} className="text-accent" aria-hidden />
            <span>
              Approved by {rs.decidedBy} {rs.decidedAt} ·{" "}
              {live ? "Queued for execution" : "Queued as Dry-run"}
            </span>
            <Link
              to="/actions"
              className="ml-auto font-medium text-accent hover:underline"
            >
              View in log
            </Link>
          </div>
        )}
        {rs.status === "rejected" && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-line bg-raised px-4 py-2.5 text-xs text-fg">
            <X size={14} className="text-fg-2" aria-hidden />
            <span>
              Rejected by {rs.decidedBy} {rs.decidedAt} · Reason:{" "}
              <strong className="font-medium text-fg">{rs.rejectReason}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-line/60">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={evidenceId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-3 text-left text-xs font-medium text-fg-2 hover:text-fg cursor-pointer"
        >
          <span>
            {open
              ? "Hide evidence and execution preview"
              : "View evidence and execution preview"}
          </span>
          <ChevronDown
            size={14}
            className={cx("transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {open && (
          <div id={evidenceId} className="grid grid-cols-2 gap-6 px-6 pb-6">
            <div>
              <p className="mb-2 text-[11px] font-medium tracking-wider text-fg-2 uppercase">
                Evidence Telemetry
              </p>
              <table className="w-full text-xs">
                <caption className="sr-only">Evidence for {rec.title}</caption>
                <tbody>
                  {rec.evidence.map((e) => (
                    <tr
                      key={e.label}
                      className="border-b border-line/40 last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-2 pr-3 text-left font-normal text-fg-2"
                      >
                        {e.label}
                      </th>
                      <td className="num py-2 text-right font-medium text-fg">
                        {e.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rec.featureId && (
                <Link
                  to={`/feature-impact?feature=${rec.featureId}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  See feature analysis <ArrowRight size={12} aria-hidden />
                </Link>
              )}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium tracking-wider text-fg-2 uppercase">
                Execution Preview
              </p>
              <ActionPreview
                data={rec.preview}
                accounts={accounts}
                sendTime={sendTime}
              />
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modal === "approve"}
        onClose={() => setModal(null)}
        tone={live ? "warning" : undefined}
        title={`Approve "${rec.verb}"?`}
        description={
          <span className="num">
            {fmtInt(accounts)} accounts · Mode:{" "}
            {live ? "Live" : "Dry-run (no real customer impact)"}
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              data-autofocus
              onClick={doApprove}
              icon={<Check size={16} aria-hidden />}
            >
              {live ? "Approve and run live" : "Approve and queue"}
            </Button>
          </>
        }
      >
        {live ? (
          <p className="flex items-start gap-2 rounded-md border border-risk-med/40 bg-risk-med/10 px-3 py-2 text-sm text-fg">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-risk-med"
              aria-hidden
            />
            You are in Live mode. This will{" "}
            {rec.type === "Pricing change"
              ? "change real prices"
              : rec.type === "Targeted email"
                ? "send real emails"
                : "show real changes"}{" "}
            to {fmtInt(accounts)} customers.
          </p>
        ) : (
          <p className="text-sm text-fg-2">
            The Action agent will prepare this as a dry run so you can check
            exactly what would go out. Switch to Live in the top bar when you
            are ready.
          </p>
        )}
        {rec.lowConfidence && (
          <p className="mt-3 text-xs text-risk-med">{rec.lowConfidence}</p>
        )}
      </Modal>

      <Modal
        open={modal === "reject"}
        onClose={() => setModal(null)}
        title="Reject this recommendation?"
        description={rec.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!reason || (reason === "Other" && !note.trim())}
              onClick={doReject}
            >
              Reject recommendation
            </Button>
          </>
        }
      >
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">
            Why are you rejecting it? (required)
          </legend>
          <div className="space-y-1.5">
            {rejectPresets.map((p) => (
              <label
                key={p}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm",
                  reason === p
                    ? "border-accent/60 bg-accent/8 text-fg"
                    : "border-line text-fg-2 hover:text-fg",
                )}
              >
                <input
                  type="radio"
                  name={`reason-${rec.id}`}
                  value={p}
                  checked={reason === p}
                  onChange={() => setReason(p)}
                  className="accent-[var(--accent)]"
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="mt-4 block text-xs text-fg-2">
          {reason === "Other"
            ? "Tell us more (required)"
            : "Add a note (optional)"}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 block w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm text-fg placeholder:text-muted"
            placeholder="This helps the Strategy agent improve future recommendations."
          />
        </label>
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Edit before approving"
        description={rec.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={doEdit}>
              Save changes
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-fg">
          Audience size
          <span className="mt-0.5 block text-xs font-normal text-fg-2">
            Start smaller to limit risk. Highest-risk accounts are kept first.
            Max {fmtInt(rec.accounts)}.
          </span>
          <input
            type="number"
            min={1}
            max={rec.accounts}
            value={editAccounts}
            onChange={(e) => setEditAccounts(Number(e.target.value))}
            className="num mt-2 h-9 w-40 rounded-md border border-line bg-canvas px-3 text-sm text-fg"
          />
        </label>
        {rec.sendTime && (
          <label className="mt-4 block text-sm font-medium text-fg">
            Send time
            <select
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="mt-2 block h-9 w-64 rounded-md border border-line bg-canvas px-3 text-sm text-fg"
            >
              {[
                rec.sendTime,
                "Mon 09:00 local time",
                "Tue 10:00 local time",
                "Wed 09:00 local time",
                "Thu 14:00 local time",
              ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((t) => (
                  <option key={t}>{t}</option>
                ))}
            </select>
          </label>
        )}
      </Modal>
    </Card>
  )
}
