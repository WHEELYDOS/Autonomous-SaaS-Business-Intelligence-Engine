# Plan: SaaS BI Engine — Churn-Intelligence Dashboard (working prototype)

## Context
- Repo is a bare scaffold: React 19, Vite 8, Tailwind v4 (`@import 'tailwindcss'` in `src/index.css`), empty `src/App.tsx`, no router/icons/charts installed.
- Deliverable is a **working coded prototype** (not Figma frames). Per the brief, Figma-file organization (Foundations / Components / Screens / Prototype) maps to code: tokens → `src/index.css`, components → `src/components`, screens → `src/pages`, prototype links → routes + shared state.
- No design system in repo, so the brief's own visual language is the design system. Follow `make/use-design-system` is not required (no DS present); `make/react-router` skill will be loaded before routing work.

## Dependencies to add
- `react-router` (v7, data/declarative router; one route per page).
- `lucide-react` (single line-icon set, 1.5px stroke).
- `recharts` for sparklines, survival curves, engagement trend, donut, before/after outcome chart, risk distribution.
- Custom SVG (no lib) for: forest plot, bubble cluster map, diverging profile bars, naive-vs-causal paired bars, experiment variant bars, segment health bars — these need precise direct labeling.
- Font: Inter via Google Fonts CSS2 `@import` at top of `src/index.css` (+ JetBrains Mono for IDs/payloads). `font-variant-numeric: tabular-nums` applied through a `.num` utility and on all table/KPI figures.

## 1. Foundations (`src/index.css`)
- `@theme` tokens as CSS variables with dark default and `[data-theme="light"]` override using the same role names:
  - `--color-canvas #0D1117`, `--color-surface #161B22`, `--color-raised #1F2630`, `--color-border #2B3340`, `--color-text #E6EAF0`, `--color-text-2 #9AA5B4`, `--color-muted #6B7685`.
  - `--color-accent #4C8DFF` (interactive only), `--color-decision #F28A3C` (pending approvals only).
  - Risk: `--color-risk-high #F0605D`, `--color-risk-med #F2B44B`, `--color-risk-low #42C38B` (always paired with label/icon).
  - Segment hues (muted, distinct from above), fixed mapping everywhere: SMB Self-Serve `#8B7FD6` (violet), Growth Teams `#4FB3BF` (teal), Enterprise Admins `#C77DB0` (mauve), Low-Engagement Starters `#B8A06A` (ochre), Power Integrators `#7F9CB5` (slate-steel). Muted-text `#6B7685` is used only for ≥ large text/icons where AA applies; body secondary uses `#9AA5B4` (AA on all surfaces).
  - Light theme: canvas `#F6F8FA`, surface `#FFFFFF`, raised `#F0F3F6`, border `#D5DBE3`, text `#1B2129`, text-2 `#4F5B6A`, muted `#6B7685`; accent/risk/decision darkened ~10% for AA on white.
- Type scale 12/14/16/20/24/32 as `--text-*`; radius `--radius 8px`, `--radius-card 12px`; 8px spacing base (Tailwind default 4px units used in multiples of 2).
- Global focus ring: `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`.
- Skeleton shimmer keyframe; `prefers-reduced-motion` disables shimmer/transitions.
- Theme toggle lives in Settings > Notifications? No — put a sun/moon toggle in the user menu at sidebar bottom (sets `data-theme` on `<html>`, persisted to localStorage).

## 2. Data layer (single source of truth)
`src/data/mock.ts` — typed constants exactly as in the brief; every page reads from here so numbers agree:
- `headline` (12,480 accts, MRR $2.66M, 1,184 at-risk, $161.9k MRR at risk / 6.1%, churn 6.4%, 14 executed, last run 2h ago).
- `riskLevels` thresholds + distribution. Derived counts (assumption): High 412, Medium 772 (= 1,184 at-risk), Low 11,296. Sum = 12,480.
- `expectedCancellations` 268/521/790; `churnReasons` 68/32.
- `segments[]` (id, name, color, accounts, avgMrr, avgRisk, atRisk, trend, flags, behavior profile vs overall, 12-week engagement series with SMB drop starting week 8).
  - Note: segment at-risk counts sum to 1,184 ✔; accounts sum to 12,480 ✔.
- `features[]` (lift, lo, hi, naive, significant, sampleSize, adoption, respondingSegments).
- `recommendations[]` R1–R5 with narrative, metrics, evidence rows, and type-specific `preview` (email / abTest / pricing / uiGuide), initial status `pending`. R5 flagged `lowConfidence`.
- `accounts[]` — the 3 named accounts + 7 more plausible at-risk rows (10 total for the table), each with id, name, segment, plan, tenure, MRR, risk, daysToCancel + range, reason, timeline events, survival series.
- `actions[]` — the 5 past actions (statuses Executed/Failed/Dry-run) + the experiment detail (Onboarding checklist v2) and outcome series (Dashboard-sharing tip: 4.6% → 3.7% vs 4.5% control).
- `actionStats` (14, 93%, 6 min, $6.4k), `approvers` [Priya S., Arjun M.].
- `pipeline` sources, schema mappings, quality stats, run stages with durations, run history.
- `survival` series 0–180 days (every 15 days) for overall + per segment; Starters and SMB fall fastest; overall at day 90 ≈ 93.6% (= 6.4% churn).
- Formatters in `src/lib/format.ts`: `fmtMoney` ($2.66M, $161.9k, $79), `fmtInt` (12,480), `fmtPct`, `fmtPts` (+6.8 pts), `fmtRange` ("4.1 to 9.5").

`src/state/AppState.tsx` — React context + `useReducer`:
- State: `recommendations` (status: pending|approved|rejected|executed|failed, rejectReason, approvedBy, approvedAt), `executionLog` (seeded from `actions`, prepended on approve), `mode` ('dry-run'|'live'), `lastRun` ({ label, loading }), `automation` ('on'|'paused'), `demoState` (normal|stale|failedRun|emptyPending), toasts queue, theme.
- Actions: `APPROVE(id)` → status approved + prepend log row `{ time: 'just now', recommendation, type, approvedBy: 'Priya S.', status: 'Dry-run' | 'Queued', accounts }`; `REJECT(id, reason)`; `REFRESH_START/END` (1.5s timeout → "updated just now"); `SET_MODE`; `TOGGLE_AUTOMATION`; `PAUSE_ALL`; `RETRY_ACTION(id)` (Failed → Executing → Executed after 1.2s); `PUSH_TOAST/DISMISS_TOAST`.
- Sidebar badge and Overview KPI "Pending approvals" are derived from `recommendations.filter(pending).length` so they stay consistent after approvals.
- State is in-memory (resets on reload) — prototype assumption.

## 3. Component library (`src/components/`)
Primitives (each with variants via props):
- `Button` (primary/secondary/ghost/danger; sm/md; icon-only with aria-label).
- `Card` (12px radius, 1px border, surface bg; optional header with title + `HowCalculated`).
- `KpiCard` (label, value, delta with direction + "vs last 30d", recharts sparkline, optional `tone="decision"` orange for Pending approvals, `HowCalculated`).
- `RiskBadge` (High/Medium/Low; icon + label + optional %; red/amber/green).
- `StatusPill` (Pending, Approved, Rejected, Executed, Failed, Dry-run, Queued, Running, OK, Warning) — icon + text.
- `ConfidenceBadge` (High/Medium/Low; Low shows warning icon; tooltip text).
- `ActionTypeTag` (UI guide, Targeted email, A/B test, Pricing change — distinct icons, neutral color).
- `SegmentChip` (color dot + name; clickable variant opens drawer).
- `DataTable` (generic columns config, sortable headers with aria-sort, row click, mono cells, skeleton rows, empty state).
- `Tabs` (role=tablist, keyboard arrows, count badges; orange count on Pending).
- `Accordion` (button + aria-expanded, collapsed by default).
- `Drawer` (right, 480px, focus-trap, Esc to close, overlay).
- `Modal` (focus trap, Esc, title/body/footer; used for approve, reject-with-reason, Live confirm, payload viewer).
- `Toast` stack (bottom-right, auto-dismiss 5s, action link e.g. "View in log").
- `Banner` (info/warning/error; stale-data >24h, failed-run, dry-run notice).
- `Popover` + `HowCalculated` (small "?" info button → plain-English explanation; Esc/outside-click closes).
- `FilterChips`, `Select` (native-styled dropdown for filters), `Switch` (role=switch), `Skeleton`, `EmptyState`, `AgentChip` (bot icon + agent name + status dot), `Tooltip`.
- `RecommendationCard` — props `rec`, `expanded`, `compact`. Anatomy: chips row (SegmentChip, ActionTypeTag, ConfidenceBadge, StatusPill if not pending); title; narrative; metrics row (accounts, est. MRR retained 90d, causal lift + range, each with HowCalculated); buttons Approve/Reject/Edit (Edit opens modal to tweak audience size/send time — prototype-level, saves to state); "View evidence" accordion with evidence table + `ActionPreview` by type. States: pending, lowConfidence (amber left strip + message), approved (who/when, "Queued for Dry-run"), rejected (reason), executed (result), failed (error + Retry). `compact` variant for Overview (title, chips, metrics, "Review" link).
- `ActionPreview` — 4 subviews: Email (subject, body excerpt, audience, send time), ABTest (variants, split 50/50, duration 21 days, success metric), Pricing (plan, old $29 → new $24/mo billed annually, 612 accounts, effective date), UIGuide (3 steps, target page `/reports`, trigger rule).

Charts (`src/components/charts/`), all with direct labels, minimal gridlines, accessible `<title>`/aria-label + visually-hidden data table fallback:
- `Sparkline` (recharts), `RiskDistribution` (horizontal stacked/three bars High/Med/Low with labels), `SegmentHealthBars` (bar length = at-risk accounts, colored by avg-risk level with RiskBadge label), `BubbleClusterMap` (SVG, positions on 2 behavior axes "Product depth" × "Engagement frequency", radius ∝ √accounts, hover/focus tooltip, click selects), `DivergingBars` (behavior metric vs overall avg, ± %), `EngagementTrend` (recharts multi-line, SMB annotation "−23% Scheduled Reports, −18% sessions" at week 9), `SurvivalCurve` (recharts step lines, overall bold + segment toggles, 30/60/90 reference lines), `Donut` (68/32 with center label), `ForestPlot` (SVG; zero line; dots + CI bars; non-significant muted + "Not significant" tag; clickable rows select feature), `NaiveVsCausalBars` (paired bars per feature + callout), `VariantBars`, `OutcomeChart` (before/after lines target vs control, verdict chip).

## 4. Shell (`src/layout/AppShell.tsx`)
- Sidebar 240px / collapsed 72px (toggle button, icon-only with tooltips, state persisted). Items with lucide icons: Overview, Segments, Churn Risk, Feature Impact, Recommendations (orange badge = pending count), Actions & Impact, Pipeline & Data, Settings. Active item: accent left bar + raised bg. Bottom: avatar "PS · Priya S., Growth Manager" with menu (theme toggle, demo-states submenu).
- Top bar 64px: page title; global filters (date range select "Last 90 days", data source "All sources", segment "All segments" — segment filter actually filters tables on Segments/Churn Risk/Recommendations); "Last analysis run: 2h ago" + Refresh (spinner → page skeletons ~1.5s → "updated just now"); mode pill Dry-run/Live (Dry-run→Live opens confirm modal with warning "Approved actions will send real emails and change real prices"; Live→Dry-run immediate); Export menu (CSV / PDF / Copy link → toast).
- `PageHeader` (title, one-line description, AgentChip) rendered by each page.
- Banners slot under the top bar driven by `demoState`: stale (>24h), failed-run ("Last run failed at Feature Analysis — showing results from 26h ago" + Retry run).
- Content: max width fluid, 32px padding, 12-col CSS grid with 24px gap (`grid grid-cols-12 gap-6`).
- Desktop-first; min-width 1280px with horizontal scroll below (assumption).

## 5. Routes & pages (`src/pages/`)
Router in `src/App.tsx` with `AppShell` layout route:
| Route | Page |
|---|---|
| `/` | Overview |
| `/segments` (`?segment=smb` opens drawer) | Segments |
| `/churn-risk` | Churn Risk |
| `/feature-impact` | Feature Impact |
| `/recommendations?tab=pending&expand=R1` | Recommendations & Approvals |
| `/actions` | Actions & Impact |
| `/pipeline` | Pipeline & Data |
| `/settings/:section?` | Settings |
| `/accounts/:id` | Customer Detail (no nav item; breadcrumb back to Churn Risk) |
| `*` | Not found → link to Overview |

**1. Overview** — 6 KPI cards (2 cols each): Total MRR $2.66M, At-risk accounts 1,184, MRR at risk $161.9k (6.1%), 90-day churn 6.4%, Pending approvals 5 (orange, links to /recommendations), Actions executed 14 (30d). Row: "Needs your decision" (8 cols) top 3 pending by est. MRR (R4 $9.3k, R1 $2.9k, R3 $1.3k) as compact cards → `/recommendations?expand=Rx`; empty state "No pending recommendations — you're all caught up"; Risk distribution (4 cols). Row: Segment health bars (6) + Anomaly alerts feed (6): SMB Scheduled Reports −23%/4wk; SMB sessions/week −18%; SMB support tickets +12%; Win-back offer failed (email timeout) with Retry link; Onboarding checklist v2 trending positive. Row: Recent actions table (12 cols) with early results.

**2. Segments** — table (dot, name, accounts, share, avg MRR, avg risk badge, trend sparkline); bubble map (7 cols) + profile panel (5 cols, selected segment defaults to SMB, diverging bars for Scheduled Reports usage, sessions/week, support tickets, seats, integrations); engagement trend 12 weeks (12 cols) with SMB annotation; "Method" accordion (plain-English explanation of grouping). Row click → Drawer: summary stats, flags, top members table (account rows → Customer Detail), linked recommendations (→ /recommendations?expand=).

**3. Churn Risk** — 4 stat tiles (268 / 521 / 790 expected cancellations, $161.9k MRR at risk); survival curve (8 cols) with segment toggles; reason donut (4 cols) 68% dissatisfaction / 32% payment; at-risk table (10 rows, sortable by risk/days/MRR, filter chips segment/reason/level, row → `/accounts/:id`); "Model quality" accordion (plain English: "When we said 70% likely, about 68% did cancel" etc.).

**4. Feature Impact** — forest plot (8 cols) + selected-feature detail panel (4 cols; default Scheduled Reports: +6.8 pts, 4.1 to 9.5, sample 8,940 accounts, 22% SMB adoption, most-responsive segments SMB & Starters); naive vs causal paired bars (12 cols) with callout "Saved Dashboards looks most important (+11.3) but its real effect is small (+2.1)"; guidance cards "Worth promoting" / "Don't prioritize"; "Assumptions" accordion.

**5. Recommendations & Approvals (hero)** — Tabs Pending (n) / Approved / Rejected / Executed (Executed tab also shows Failed with Retry); filters segment / action type / confidence + clear; list of RecommendationCards; `?expand=` auto-expands and scrolls/focuses that card. Approve → Modal "Approve and queue 'Launch in-app guide'? 612 accounts · Mode: Dry-run, no real messages sent" (in Live mode copy changes to a warning) → toast "Approved — queued as Dry-run · View in log" → card moves to Approved tab; log row added on /actions. Reject → modal with required reason (radio presets: Not now / Disagree with evidence / Overlaps another action / Other + textarea) → Rejected tab. Empty states per tab. Edit → modal to adjust audience/send time; saves and shows "Edited" tag.
  - Executed/Failed demo cards for states: Approved/Executed/Failed states demonstrated using past actions mapped into card form in Executed tab (Dashboard-sharing tip Executed, Win-back offer Failed with Retry).

**6. Actions & Impact** — 4 stat tiles; execution log table (time, recommendation, type, approved by, status pill, accounts, "View payload" → modal with mono JSON); automation card (Switch On/Paused + "Pause all automation" danger button with confirm); experiment card (Onboarding checklist v2: variant bars, +3.2 pts vs control, day 12/21 progress, p=0.04 → "Likely real effect"); outcome chart for Dashboard-sharing tip (Growth Teams 4.6%→3.7% vs control 4.5%, verdict "Worked"); Failed row has Retry.

**7. Pipeline & Data (lighter)** — tabs Data | Model health (disabled, "Coming soon"); source cards with status dots + label (Billing, Product usage, Support, CRM, Demo dataset); schema mapping table (editable canonical-field select, match status OK/Derived/Needs review); 4 data-quality cards; six-stage run stepper with durations/status; run history table (include the failed run at Feature Analysis 26h ago); "Run analysis now" (triggers refresh flow) + schedule dropdown (Daily 06:00).

**8. Settings (lighter)** — left sub-nav: Approval rules (locked-on switch with lock icon + tooltip; approver role select per action type), Thresholds (High ≥60%, Medium ≥30%, churn window 90 days — number inputs, "Save" toast), Integrations (4 cards: status, Mock/Live toggle, masked credential `sk_live_••••4f2a` with reveal button), Users & roles (Priya S. Admin/Approver, Arjun M. Approver), Notifications (email/Slack toggles).

**9. Customer Detail (lighter)** — header (ACC-20417 mono, Brightleaf Studio, SMB chip, Pro, 14 months, $79 MRR); risk card (74% High, ~38 days range 21–61, dissatisfaction reasons list) + survival curve; activity timeline (usage, payments, support, CSAT); "Recommendations and actions that touched this account" (R1, R5); similar accounts (same segment) → their detail pages. Works for all 10 accounts; unknown id → not-found card.

## 6. States
- Loading skeletons on every page during Refresh (`lastRun.loading`).
- Empty: pending tab / Overview decision panel when all handled.
- Stale-data and failed-run banners, plus failed action with Retry.
- Demo-state switcher in avatar menu ("Preview states: Normal / Stale data / Failed run / All caught up") so reviewers can see each state — assumption, since mock data is otherwise always fresh.

## 7. Build order
1. Install deps (`pnpm add react-router lucide-react recharts`); load `make/react-router` skill.
2. Tokens, fonts, base styles in `src/index.css`.
3. `mock.ts`, `format.ts`, `AppState.tsx`.
4. Primitives → RecommendationCard/ActionPreview → charts.
5. AppShell + router.
6. Pages 1–5 fully, then 6–9.
7. Wire prototype links/flows.
8. QA pass.

## 8. Verification
- `pnpm build` (runs Vite build/TS transpile) once after all pages are in; fix errors. Do not start the dev server (already running).
- Manual flow check in preview: sidebar nav all routes; Overview card → expanded card on page 5; Approve → modal → toast → Approved tab + new Dry-run row on /actions + sidebar badge 5→4 + Overview KPI 4; Reject → reason → Rejected tab; account row → detail; segment row → drawer; Refresh → skeleton → "updated just now"; Dry-run → Live confirm; Retry on failed action; theme toggle.
- Numbers QA checklist: segment accounts sum 12,480; at-risk sum 1,184; risk distribution sums; MRR at-risk $161.9k / $2.66M = 6.1%; R-card numbers identical in Overview, page 5, drawer, customer detail; survival day-90 overall ≈ 93.6%; 14 executed/93%/6 min/$6.4k consistent between Overview and Actions.
- Keyboard: tab through shell, tabs arrow keys, modals trap focus and Esc closes, focus ring visible; contrast AA spot-check on both themes.

## Assumptions (to list for the user at the end)
- Built as a coded prototype; Figma page organization mapped to code folders.
- Risk distribution split High 412 / Medium 772 / Low 11,296 (not given).
- Seven additional at-risk accounts invented to fill the 10-row table, consistent with segment stats.
- Segment hue choices, bubble-map axes, profile metrics, and 12-week series are invented but consistent.
- Pricing preview for R5: Starter $29/mo → $24/mo billed annually; A/B test 50/50 split, 21 days, metric 90-day retention.
- Current user is Priya S. (approver); approvals logged under her name.
- State is in-memory; resets on reload. Live mode only changes copy/labels (no real side effects).
- Desktop-only, min width 1280px.
- Demo-state switcher added to preview stale/failed/empty states.
