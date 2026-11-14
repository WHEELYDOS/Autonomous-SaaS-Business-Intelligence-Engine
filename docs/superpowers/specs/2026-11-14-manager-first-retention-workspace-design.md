# Manager-First Retention Workspace

## Intent

Turn the Autonomous SaaS BI Engine from a technically impressive analysis console into a clear daily workspace for managers. The product should answer four questions quickly:

1. What needs attention today?
2. Which customers or revenue are at risk?
3. What action does the system recommend, and why?
4. What has automation already done, and what still needs approval?

The README, frontend navigation, and visible terminology should describe the same product: a churn-prevention operations workspace with safe automation and human approval for consequential actions.

## Goals

- Make the manager's primary workflow visible from the Overview screen.
- Reduce default navigation from eight peer-level destinations to four manager-focused destinations.
- Keep customer search/detail, recommendations/approvals, and action history easy to reach.
- Demote technical diagnostics (segments, feature impact, pipeline telemetry) without deleting working analytical capabilities.
- Make automation state, dry-run/live mode, data freshness, and backend availability explicit.
- Remove misleading product language and sample-data ambiguity from the primary experience.
- Align README terminology, routes, navigation labels, metrics, and launch instructions.
- Preserve current FastAPI endpoints and existing approval behavior wherever practical.

## Non-goals

- Replacing the existing ML models, agent orchestration, or canonical data contract.
- Adding real CRM, billing, email, or scheduling integrations in this pass.
- Making live execution the default.
- Removing analytical code that may be useful for future technical or admin users.
- Building a full role/permission system.

## Anti-goals

- Do not make managers understand DBSCAN, Cox PH, DML, LangChain, or LangGraph to complete a task.
- Do not present mock/sample values as if they were connected production data.
- Do not hide approval gates behind vague automation language.
- Do not create more pages or more configuration controls as a substitute for a clearer workflow.

## Current findings

- The frontend currently exposes Overview, Segments, Churn Risk, Feature Impact, Recommendations, Actions & Impact, Pipeline & Data, and Settings as peer navigation items.
- Overview already contains the right raw ingredients—pending decisions, risk KPIs, alerts, and recent actions—but also gives prominent space to five-agent telemetry and technical model labels.
- AppState already bootstraps backend status, recommendations, action history, and settings, while preserving mock fallback data. This can support a gradual UI refactor without changing the API contract.
- The current README leads with implementation detail and claims a nine-page production dashboard, which reinforces the wrong mental model for managers.
- The app includes demo-state controls in the account popover. These are useful during development but should not be part of the default manager workflow.

## Approaches considered

### A. Manager-first consolidation (selected)

Use four primary destinations:

- **Overview** — daily briefing, revenue exposure, priority decisions, automation health.
- **Customers** — searchable at-risk customer list and customer detail.
- **Recommendations** — ranked actions with evidence and approve/reject controls.
- **Activity** — executed actions, failures, approvals, and run freshness.

Technical pages remain available as secondary/advanced destinations from relevant screens or an admin-only area. This gives managers a short navigation path while preserving existing capability.

### B. Preserve all pages and only restyle them

This minimizes route changes but keeps the current technical information architecture and page overload. It does not solve the central product mismatch.

### C. Fully autonomous operations first

This would prioritize schedules and automatic execution before improving the manager experience. It is premature because the current project uses cached pipeline output and mock action tools; the safer sequence is to make state and approvals clear first, then expand automation.

## User experience design

### Primary navigation

```text
Overview
Customers
Recommendations   [pending count]
Activity
```

Settings remains accessible from the account/settings control. Advanced analysis is reachable contextually from Overview, Customers, or Activity rather than competing with the daily workflow.

### Overview layout

```text
[Today’s retention briefing]             [Run analysis] [Dry-run]

[MRR at risk] [At-risk customers] [Pending decisions] [Actions this month]

Needs your decision                         Automation status
[top ranked recommendation cards]             [last run, freshness, mode]

Priority customers                           Recent activity
[compact risk list]                           [latest action outcomes]
```

The page should lead with decisions and exceptions. Agent/model telemetry becomes a compact “How this was calculated” or advanced detail, not the hero content.

### Manager language

- “At-risk customers” instead of “churn prediction output”.
- “Revenue at risk” instead of model-specific risk terminology.
- “Recommended action” instead of “strategy agent output”.
- “Automation status” instead of “agent telemetry”.
- “Analysis run” instead of “pipeline execution” in primary UI copy.
- Technical method names remain in advanced explanations and README technical sections.

### Safe automation

- Keep dry-run as the default.
- Show a persistent, readable mode indicator.
- Show whether the latest data is current, stale, or unavailable.
- Keep approval-required actions in Recommendations with an explicit consequence statement.
- Keep retry and failure states in Activity.
- Do not silently fall back from failed backend calls to values that look live; label fallback/sample mode visibly.

## Implementation boundaries

### Frontend

- Update `Frontend/src/layout/AppShell.tsx` navigation and titles.
- Update `Frontend/src/routes.tsx` to provide the four primary routes while preserving direct access to existing analytical routes during transition.
- Refocus `Frontend/src/pages/Overview.tsx` around manager decisions and automation status.
- Add or adapt a Customers landing page using existing customer API/data types and the existing CustomerDetail route.
- Rename/reframe Actions as Activity in navigation and visible copy.
- Move technical destinations to contextual links or an advanced section.
- Keep the existing state and API modules unless a concrete mismatch is found.
- Add visible backend/sample/freshness labeling so offline/demo mode is honest.

### Documentation

- Rewrite the README opening, feature list, dashboard section, quick start, and repository structure to describe the manager workflow first.
- Keep a concise technical architecture section for academic/project credibility.
- Correct claims that are not represented by the code (for example, unsupported model/library/version claims).
- Document the four primary workflows and the safe automation boundary.

### Backend

- Do not change API contracts in the first pass unless required to support the Customers screen or accurate freshness/status messaging.
- Treat action tools as simulated until real integrations are configured.
- Preserve the existing approval/audit behavior.

## Success criteria

- A manager can identify the most important pending decision from Overview without opening a technical page.
- A manager can reach an at-risk customer and their recommendation in two clicks or fewer.
- The default navigation contains no more than four peer-level manager destinations.
- The UI clearly distinguishes dry-run, live, backend unavailable, stale data, and sample/demo states.
- README and frontend use the same names for the product, primary screens, and workflow.
- Existing frontend production build succeeds after the refactor.
- Existing backend approval and refresh endpoints remain usable.

## Open implementation calls

- Existing analytical routes will be preserved as direct routes during the first refactor to avoid breaking bookmarks; they will be removed from primary navigation and linked as advanced analysis.
- The Customers landing page will use the existing `/api/customers` contract and mock data fallback pattern, but must show a clear data-source state.
- “Activity” is a presentation label; the existing `/actions` route and API remain valid for compatibility.
