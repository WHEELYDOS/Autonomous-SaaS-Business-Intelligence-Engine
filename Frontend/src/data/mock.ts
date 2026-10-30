/**
 * Single source of truth for every number in the prototype.
 * All pages read from here so figures agree across screens.
 */

export type SegmentId = 'smb' | 'growth' | 'enterprise' | 'starters' | 'power'
export type RiskLevel = 'High' | 'Medium' | 'Low'
export type Confidence = 'High' | 'Medium' | 'Low'
export type ActionType = 'UI guide' | 'Targeted email' | 'A/B test' | 'Pricing change'
export type ChurnReason = 'Dissatisfaction' | 'Payment'

/* ------------------------------------------------------------------ */
/* Headline + thresholds                                               */
/* ------------------------------------------------------------------ */

export const headline = {
  accounts: 12480,
  mrr: 2_660_000,
  atRisk: 1184,
  mrrAtRisk: 161_900,
  mrrAtRiskShare: 6.1,
  churn90: 6.4,
  actionsExecuted30d: 14,
  lastRun: '2h ago',
}

export const thresholds = { high: 60, medium: 30, windowDays: 90 }

export function levelFor(prob: number): RiskLevel {
  if (prob >= thresholds.high) return 'High'
  if (prob >= thresholds.medium) return 'Medium'
  return 'Low'
}

export const riskDistribution: { level: RiskLevel; accounts: number; range: string }[] = [
  { level: 'High', accounts: 412, range: '60% or more likely to cancel' },
  { level: 'Medium', accounts: 772, range: '30–59% likely to cancel' },
  { level: 'Low', accounts: 11296, range: 'Under 30% likely to cancel' },
]

export const expectedCancellations = [
  { window: 'Next 30 days', accounts: 268 },
  { window: 'Next 60 days', accounts: 521 },
  { window: 'Next 90 days', accounts: 790 },
]

export const churnReasons = [
  {
    reason: 'Dissatisfaction' as ChurnReason,
    share: 68,
    detail: 'Falling usage, unresolved tickets, low CSAT',
  },
  {
    reason: 'Payment' as ChurnReason,
    share: 32,
    detail: 'Failed cards, expiring payment methods, downgrades',
  },
]

export const kpiTrends = {
  mrr: { delta: 1.8, unit: '%', good: true, series: [2.58, 2.59, 2.6, 2.6, 2.61, 2.62, 2.62, 2.63, 2.64, 2.64, 2.65, 2.66] },
  atRisk: { delta: 6.2, unit: '%', good: false, series: [1062, 1071, 1068, 1080, 1092, 1101, 1110, 1124, 1139, 1152, 1170, 1184] },
  mrrAtRisk: { delta: 4.9, unit: '%', good: false, series: [149, 150, 150, 152, 153, 154, 155, 157, 158, 159, 161, 161.9] },
  churn: { delta: 0.3, unit: ' pts', good: false, series: [6.1, 6.1, 6.1, 6.2, 6.2, 6.2, 6.3, 6.3, 6.3, 6.4, 6.4, 6.4] },
  executed: { delta: 4, unit: '', good: true, series: [0, 1, 1, 2, 2, 1, 3, 1, 0, 2, 1, 0] },
}

/* ------------------------------------------------------------------ */
/* Segments                                                            */
/* ------------------------------------------------------------------ */

export type Segment = {
  id: SegmentId
  name: string
  color: string
  accounts: number
  avgMrr: number
  avgRisk: number
  riskLevel: RiskLevel
  atRisk: number
  mrrAtRisk: number
  riskTrend: number
  riskSeries: number[]
  flags: string[]
  summary: string
  position: { depth: number; frequency: number }
  profile: { metric: string; delta: number }[]
  engagement: number[]
}

export const profileMetrics = ['Scheduled Reports usage', 'Sessions per week', 'Support tickets', 'Seats per account', 'Integrations connected']

export const segments: Segment[] = [
  {
    id: 'smb',
    name: 'SMB Self-Serve',
    color: '#8B7FD6',
    accounts: 4210,
    avgMrr: 79,
    avgRisk: 14.2,
    riskLevel: 'High',
    atRisk: 486,
    mrrAtRisk: 36_200,
    riskTrend: 4.2,
    riskSeries: [9.8, 9.9, 10.1, 10.0, 10.3, 10.4, 10.6, 11.4, 12.3, 13.1, 13.8, 14.2],
    flags: ['Scheduled Reports usage down 23% in 4 weeks', 'Sessions per week down 18%', 'Support tickets up 12%'],
    summary: 'Small teams on self-serve plans. Light on reports and integrations; usage is slipping.',
    position: { depth: 34, frequency: 48 },
    profile: [
      { metric: 'Scheduled Reports usage', delta: -31 },
      { metric: 'Sessions per week', delta: -14 },
      { metric: 'Support tickets', delta: 22 },
      { metric: 'Seats per account', delta: -48 },
      { metric: 'Integrations connected', delta: -36 },
    ],
    engagement: [5.6, 5.7, 5.6, 5.7, 5.6, 5.6, 5.7, 5.4, 5.1, 4.9, 4.7, 4.6],
  },
  {
    id: 'growth',
    name: 'Growth Teams',
    color: '#4FB3BF',
    accounts: 2860,
    avgMrr: 245,
    avgRisk: 5.9,
    riskLevel: 'Medium',
    atRisk: 168,
    mrrAtRisk: 38_400,
    riskTrend: -0.6,
    riskSeries: [6.6, 6.5, 6.5, 6.4, 6.4, 6.3, 6.2, 6.2, 6.1, 6.0, 5.9, 5.9],
    flags: ['Dashboard-sharing tip reduced churn 0.9 pts', 'Slack integration under-adopted (31%)'],
    summary: 'Mid-size teams that share dashboards widely. Responding well to collaboration features.',
    position: { depth: 62, frequency: 66 },
    profile: [
      { metric: 'Scheduled Reports usage', delta: 18 },
      { metric: 'Sessions per week', delta: 9 },
      { metric: 'Support tickets', delta: -6 },
      { metric: 'Seats per account', delta: 12 },
      { metric: 'Integrations connected', delta: 21 },
    ],
    engagement: [7.8, 7.9, 7.8, 8.0, 8.1, 8.0, 8.2, 8.3, 8.3, 8.4, 8.4, 8.5],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Admins',
    color: '#C77DB0',
    accounts: 1140,
    avgMrr: 868,
    avgRisk: 3.4,
    riskLevel: 'Low',
    atRisk: 74,
    mrrAtRisk: 55_100,
    riskTrend: -0.2,
    riskSeries: [3.7, 3.7, 3.6, 3.6, 3.6, 3.5, 3.5, 3.5, 3.4, 3.4, 3.4, 3.4],
    flags: ['Few accounts at risk, but they carry the most MRR', 'Admins rarely share dashboards with their teams'],
    summary: 'Large accounts run by admins. Low risk overall, but each loss is expensive.',
    position: { depth: 78, frequency: 40 },
    profile: [
      { metric: 'Scheduled Reports usage', delta: 26 },
      { metric: 'Sessions per week', delta: -8 },
      { metric: 'Support tickets', delta: -18 },
      { metric: 'Seats per account', delta: 86 },
      { metric: 'Integrations connected', delta: 44 },
    ],
    engagement: [6.1, 6.1, 6.0, 6.2, 6.1, 6.0, 6.1, 6.1, 6.0, 6.0, 6.1, 6.0],
  },
  {
    id: 'starters',
    name: 'Low-Engagement Starters',
    color: '#B8A06A',
    accounts: 2630,
    avgMrr: 49,
    avgRisk: 18.7,
    riskLevel: 'High',
    atRisk: 402,
    mrrAtRisk: 17_900,
    riskTrend: 1.1,
    riskSeries: [17.4, 17.5, 17.6, 17.6, 17.8, 17.9, 18.0, 18.1, 18.3, 18.4, 18.6, 18.7],
    flags: ['58% never finished onboarding', 'Highest churn of any segment'],
    summary: 'New accounts that never got going. Most stall before finishing onboarding.',
    position: { depth: 16, frequency: 20 },
    profile: [
      { metric: 'Scheduled Reports usage', delta: -62 },
      { metric: 'Sessions per week', delta: -55 },
      { metric: 'Support tickets', delta: 8 },
      { metric: 'Seats per account', delta: -71 },
      { metric: 'Integrations connected', delta: -80 },
    ],
    engagement: [2.4, 2.4, 2.3, 2.4, 2.3, 2.3, 2.3, 2.2, 2.3, 2.2, 2.2, 2.2],
  },
  {
    id: 'power',
    name: 'Power Integrators',
    color: '#7F9CB5',
    accounts: 1640,
    avgMrr: 310,
    avgRisk: 2.6,
    riskLevel: 'Low',
    atRisk: 54,
    mrrAtRisk: 14_300,
    riskTrend: 0,
    riskSeries: [2.6, 2.6, 2.7, 2.6, 2.6, 2.6, 2.6, 2.6, 2.7, 2.6, 2.6, 2.6],
    flags: ['Most stable segment', 'Heavy API and integration users'],
    summary: 'Technical teams wired into many tools. Very sticky.',
    position: { depth: 88, frequency: 84 },
    profile: [
      { metric: 'Scheduled Reports usage', delta: 41 },
      { metric: 'Sessions per week', delta: 38 },
      { metric: 'Support tickets', delta: -24 },
      { metric: 'Seats per account', delta: 35 },
      { metric: 'Integrations connected', delta: 92 },
    ],
    engagement: [11.4, 11.5, 11.3, 11.6, 11.5, 11.6, 11.5, 11.7, 11.6, 11.7, 11.8, 11.8],
  },
]

export const segmentById = Object.fromEntries(segments.map((s) => [s.id, s])) as Record<SegmentId, Segment>

export const segmentMethod = [
  'We look at how each account used the product over the last 90 days: how often people log in, which features they use, how many seats are active, how many tools they connect, and how often they contact support.',
  'Accounts with similar habits are grouped together. We picked five groups because adding more did not produce groups that behaved meaningfully differently.',
  'Groups are refreshed with every analysis run. An account can move between groups as its behavior changes.',
]

/* ------------------------------------------------------------------ */
/* Survival (share of accounts still subscribed)                       */
/* ------------------------------------------------------------------ */

const survivalAt90: Record<'overall' | SegmentId, number> = {
  overall: 0.936,
  smb: 0.905,
  growth: 0.951,
  enterprise: 0.973,
  starters: 0.874,
  power: 0.981,
}

export const survivalDays = Array.from({ length: 13 }, (_, i) => i * 15)

export const survival = survivalDays.map((day) => {
  const row: Record<string, number> = { day }
  for (const [key, s90] of Object.entries(survivalAt90)) {
    const lambda = -Math.log(s90) / 90
    row[key] = Math.round(Math.exp(-lambda * day) * 1000) / 10
  }
  return row
})

/* ------------------------------------------------------------------ */
/* Causal feature impact                                               */
/* ------------------------------------------------------------------ */

export type Feature = {
  id: string
  name: string
  lift: number
  lo: number
  hi: number
  naive: number
  significant: boolean
  sampleSize: number
  adoption: string
  responding: SegmentId[]
  explanation: string
}

export const features: Feature[] = [
  {
    id: 'scheduled-reports',
    name: 'Scheduled Reports',
    lift: 6.8,
    lo: 4.1,
    hi: 9.5,
    naive: 8.9,
    significant: true,
    sampleSize: 8940,
    adoption: '22% of SMB Self-Serve',
    responding: ['smb', 'starters'],
    explanation: 'Accounts that set up at least one scheduled report keep their subscription 6.8 points more often over 90 days than similar accounts that do not.',
  },
  {
    id: 'onboarding-checklist',
    name: 'Onboarding checklist completed',
    lift: 4.9,
    lo: 2.6,
    hi: 7.2,
    naive: 7.4,
    significant: true,
    sampleSize: 6120,
    adoption: '42% of Low-Engagement Starters',
    responding: ['starters'],
    explanation: 'Finishing the onboarding checklist in the first two weeks has a clear, lasting effect, strongest for new low-engagement accounts.',
  },
  {
    id: 'slack-integration',
    name: 'Slack integration',
    lift: 3.6,
    lo: 1.2,
    hi: 6.0,
    naive: 5.8,
    significant: true,
    sampleSize: 5310,
    adoption: '31% of Growth Teams',
    responding: ['growth', 'smb'],
    explanation: 'Getting alerts in Slack brings people back to the product. The effect is real but smaller than it first appears.',
  },
  {
    id: 'dashboard-sharing',
    name: 'Dashboard sharing',
    lift: 3.1,
    lo: 0.9,
    hi: 5.3,
    naive: 4.2,
    significant: true,
    sampleSize: 7480,
    adoption: '54% of Growth Teams',
    responding: ['growth', 'enterprise'],
    explanation: 'Sharing a dashboard with teammates spreads usage across the account, making it harder to cancel.',
  },
  {
    id: 'saved-dashboards',
    name: 'Saved Dashboards',
    lift: 2.1,
    lo: -0.4,
    hi: 4.6,
    naive: 11.3,
    significant: false,
    sampleSize: 9870,
    adoption: '71% of all accounts',
    responding: [],
    explanation: 'Engaged accounts save dashboards, but saving dashboards does not itself keep accounts around. Most of the raw difference comes from who uses it, not what it does.',
  },
  {
    id: 'custom-fields',
    name: 'Custom fields',
    lift: 0.8,
    lo: -1.6,
    hi: 3.2,
    naive: 3.9,
    significant: false,
    sampleSize: 4020,
    adoption: '18% of all accounts',
    responding: [],
    explanation: 'No reliable effect on retention once account size and engagement are taken into account.',
  },
  {
    id: 'dark-mode',
    name: 'Dark mode',
    lift: 0.2,
    lo: -1.9,
    hi: 2.3,
    naive: 1.5,
    significant: false,
    sampleSize: 3650,
    adoption: '27% of all accounts',
    responding: [],
    explanation: 'A nice-to-have with no measurable effect on whether accounts stay.',
  },
]

export const featureAssumptions = [
  'We compare accounts that use a feature with similar accounts that do not, matching on size, plan, tenure, and how active they were before adopting it.',
  'We assume there is no hidden factor that drives both feature use and retention that we failed to measure. Strong results are double-checked by testing whether the effect holds when we deliberately leave data out.',
  'Ranges show where the true effect most likely sits (95% confidence). When a range crosses zero, we cannot tell the effect apart from no effect.',
  'Effects are averages. Individual segments may respond more or less strongly, shown as "Most responsive segments".',
]

/* ------------------------------------------------------------------ */
/* Recommendations                                                     */
/* ------------------------------------------------------------------ */

export type ActionPreviewData =
  | { kind: 'uiGuide'; steps: string[]; targetPage: string; trigger: string }
  | { kind: 'email'; subject: string; body: string; audience: string; sendTime: string }
  | { kind: 'abTest'; variants: { name: string; description: string }[]; split: string; duration: string; metric: string }
  | { kind: 'pricing'; plan: string; oldPrice: string; newPrice: string; billing: string; accounts: number; effectiveDate: string }

export type Recommendation = {
  id: string
  title: string
  verb: string
  segment: SegmentId
  type: ActionType
  confidence: Confidence
  lowConfidence?: string
  narrative: string
  accounts: number
  mrrRetained: number
  lift: number
  lo: number
  hi: number
  featureId?: string
  evidence: { label: string; value: string }[]
  preview: ActionPreviewData
  sendTime?: string
}

export const recommendations: Recommendation[] = [
  {
    id: 'R1',
    title: 'Launch in-app guide for Scheduled Reports',
    verb: 'Launch in-app guide',
    segment: 'smb',
    type: 'UI guide',
    confidence: 'High',
    narrative:
      'SMB Self-Serve accounts that schedule a report keep their subscription 6.8 points more often. Only 22% have tried it, and usage fell 23% in the last four weeks. A three-step guide on the Reports page targets the at-risk accounts that have never scheduled one.',
    accounts: 612,
    mrrRetained: 2_900,
    lift: 6.8,
    lo: 4.1,
    hi: 9.5,
    featureId: 'scheduled-reports',
    evidence: [
      { label: 'Effect on 90-day retention', value: '+6.8 pts (4.1 to 9.5)' },
      { label: 'Accounts studied', value: '8,940' },
      { label: 'Current adoption in segment', value: '22%' },
      { label: 'Recent trend', value: 'Scheduled Reports usage −23% over 4 weeks' },
      { label: 'Source', value: 'Causal Feature Impact agent, run 2h ago' },
    ],
    preview: {
      kind: 'uiGuide',
      targetPage: '/reports',
      trigger: 'Account is SMB Self-Serve, risk ≥ 30%, and has never scheduled a report. Show once per user on their next visit to Reports.',
      steps: [
        'Pick a report you already open every week',
        'Choose when it should arrive (e.g. Mondays at 9:00)',
        'Add teammates who should get it by email',
      ],
    },
  },
  {
    id: 'R2',
    title: 'Nudge Low-Engagement Starters to finish onboarding',
    verb: 'Send onboarding email',
    segment: 'starters',
    type: 'Targeted email',
    confidence: 'Medium',
    narrative:
      'Finishing the onboarding checklist lifts 90-day retention by 4.9 points for new accounts. 58% of Low-Engagement Starters stalled before step 3. A short email links them straight to the step they left off.',
    accounts: 540,
    mrrRetained: 1_200,
    lift: 4.9,
    lo: 2.6,
    hi: 7.2,
    featureId: 'onboarding-checklist',
    sendTime: 'Tue 10:00 local time',
    evidence: [
      { label: 'Effect on 90-day retention', value: '+4.9 pts (2.6 to 7.2)' },
      { label: 'Accounts studied', value: '6,120' },
      { label: 'Stalled before step 3', value: '58% of segment' },
      { label: 'Past email open rate (segment)', value: '31%' },
      { label: 'Source', value: 'Causal Feature Impact agent, run 2h ago' },
    ],
    preview: {
      kind: 'email',
      subject: "You're two steps away from your first live dashboard",
      body: 'Hi {first_name}, you started setting up {workspace} last week. Connect a data source and invite one teammate to see your numbers update on their own. It takes about four minutes.',
      audience: '540 accounts · Low-Engagement Starters · checklist < 3 of 5',
      sendTime: 'Tue 10:00 local time',
    },
  },
  {
    id: 'R3',
    title: 'A/B test a Slack integration prompt for Growth Teams',
    verb: 'Start A/B test',
    segment: 'growth',
    type: 'A/B test',
    confidence: 'Medium',
    narrative:
      'Slack alerts bring people back: +3.6 points on 90-day retention. Only 31% of Growth Teams have connected Slack. Test whether a prompt after a dashboard is shared raises connections, before rolling it out to everyone.',
    accounts: 320,
    mrrRetained: 1_300,
    lift: 3.6,
    lo: 1.2,
    hi: 6.0,
    featureId: 'slack-integration',
    evidence: [
      { label: 'Effect on 90-day retention', value: '+3.6 pts (1.2 to 6.0)' },
      { label: 'Accounts studied', value: '5,310' },
      { label: 'Current adoption in segment', value: '31%' },
      { label: 'Why a test first', value: 'Range is wide; a test confirms the effect for this audience' },
      { label: 'Source', value: 'Strategy agent, run 2h ago' },
    ],
    preview: {
      kind: 'abTest',
      variants: [
        { name: 'Control', description: 'No prompt (current experience)' },
        { name: 'Variant B', description: 'Prompt "Get this dashboard in Slack" after sharing' },
      ],
      split: '50 / 50',
      duration: '21 days',
      metric: '90-day retention (early read: Slack connections)',
    },
  },
  {
    id: 'R4',
    title: 'Email at-risk Enterprise Admins about sharing dashboards',
    verb: 'Send admin email',
    segment: 'enterprise',
    type: 'Targeted email',
    confidence: 'High',
    narrative:
      'Only 74 Enterprise accounts are at risk, but together they carry $55.1k MRR. Admins in these accounts rarely share dashboards, and sharing lifts retention by 3.1 points. The same tip already cut churn for Growth Teams. A personal email from their CSM shows admins how to roll dashboards out to their team.',
    accounts: 74,
    mrrRetained: 9_300,
    lift: 3.1,
    lo: 0.9,
    hi: 5.3,
    featureId: 'dashboard-sharing',
    sendTime: 'Wed 09:00 local time',
    evidence: [
      { label: 'Effect on 90-day retention', value: '+3.1 pts (0.9 to 5.3)' },
      { label: 'MRR at risk in audience', value: '$55.1k' },
      { label: 'Proven elsewhere', value: 'Growth Teams churn 4.6% → 3.7% after the same tip' },
      { label: 'Dashboards shared per admin', value: '0.4 vs 2.7 in healthy accounts' },
      { label: 'Source', value: 'Strategy agent, run 2h ago' },
    ],
    preview: {
      kind: 'email',
      subject: 'Three dashboards your team will actually open',
      body: 'Hi {first_name}, teams at {company} who see the same dashboards make faster calls. Here are the three most-viewed dashboards in your workspace, with a one-click way to share them with everyone on your team.',
      audience: '74 accounts · Enterprise Admins · risk ≥ 30%',
      sendTime: 'Wed 09:00 local time',
    },
  },
  {
    id: 'R5',
    title: 'Offer annual billing discount to payment-risk SMB accounts',
    verb: 'Apply pricing change',
    segment: 'smb',
    type: 'Pricing change',
    confidence: 'Low',
    lowConfidence:
      'Low confidence: the effect range crosses zero and the model has little history with price changes. Consider an A/B test first.',
    narrative:
      '32% of predicted cancellations are payment-related. SMB accounts with a recent failed card might stay if offered a cheaper annual plan. The expected effect is small and uncertain.',
    accounts: 388,
    mrrRetained: 1_100,
    lift: 1.4,
    lo: -0.8,
    hi: 3.6,
    evidence: [
      { label: 'Effect on 90-day retention', value: '+1.4 pts (−0.8 to 3.6)' },
      { label: 'Accounts studied', value: '1,240 (past discount offers)' },
      { label: 'Payment-related share of churn', value: '32%' },
      { label: 'Revenue trade-off', value: '−$5 per seat / month for accepted offers' },
      { label: 'Source', value: 'Strategy agent, run 2h ago' },
    ],
    preview: {
      kind: 'pricing',
      plan: 'Pro (per seat)',
      oldPrice: '$29/mo billed monthly',
      newPrice: '$24/mo billed annually',
      billing: 'Offer shown at next renewal or after a failed payment',
      accounts: 388,
      effectiveDate: 'Next billing cycle after acceptance',
    },
  },
]

export const recommendationById = Object.fromEntries(recommendations.map((r) => [r.id, r])) as Record<string, Recommendation>

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export type TimelineEvent = { date: string; kind: 'usage' | 'payment' | 'support' | 'csat'; text: string; tone?: 'bad' | 'good' }

export type Account = {
  id: string
  name: string
  segment: SegmentId
  plan: string
  tenureMonths: number
  mrr: number
  risk: number
  days: number
  daysLo: number
  daysHi: number
  reason: ChurnReason
  drivers: string[]
  recs: string[]
  timeline: TimelineEvent[]
}

export const accounts: Account[] = [
  {
    id: 'ACC-20417',
    name: 'Brightleaf Studio',
    segment: 'smb',
    plan: 'Pro',
    tenureMonths: 14,
    mrr: 79,
    risk: 74,
    days: 38,
    daysLo: 21,
    daysHi: 61,
    reason: 'Dissatisfaction',
    drivers: ['Stopped opening Scheduled Reports 5 weeks ago', 'Sessions per week fell from 6 to 2', 'Two support tickets about slow exports, one unresolved', 'CSAT dropped from 4 to 2'],
    recs: ['R1', 'R5'],
    timeline: [
      { date: 'Oct 7', kind: 'csat', text: 'CSAT survey: 2 / 5 ("exports are too slow")', tone: 'bad' },
      { date: 'Oct 2', kind: 'support', text: 'Ticket #8812 opened: export times out (unresolved)', tone: 'bad' },
      { date: 'Sep 24', kind: 'usage', text: 'Last scheduled report opened', tone: 'bad' },
      { date: 'Sep 18', kind: 'support', text: 'Ticket #8640 resolved: slow dashboard load' },
      { date: 'Sep 1', kind: 'payment', text: 'Invoice paid: $79.00', tone: 'good' },
      { date: 'Aug 12', kind: 'usage', text: 'Peak usage: 6 sessions/week, 3 active seats', tone: 'good' },
    ],
  },
  {
    id: 'ACC-18833',
    name: 'Northwind Analytics',
    segment: 'growth',
    plan: 'Business',
    tenureMonths: 22,
    mrr: 420,
    risk: 68,
    days: 29,
    daysLo: 18,
    daysHi: 47,
    reason: 'Payment',
    drivers: ['Card declined twice this month', 'Billing contact left the company', 'Usage steady'],
    recs: ['R3'],
    timeline: [],
  },
  {
    id: 'ACC-31025',
    name: 'Pinecrest Labs',
    segment: 'starters',
    plan: 'Starter',
    tenureMonths: 3,
    mrr: 49,
    risk: 81,
    days: 17,
    daysLo: 9,
    daysHi: 30,
    reason: 'Dissatisfaction',
    drivers: ['Onboarding stalled at step 2 of 5', 'Only one seat ever active', 'No data source connected'],
    recs: ['R2'],
    timeline: [],
  },
  {
    id: 'ACC-27741',
    name: 'Copperleaf Media',
    segment: 'smb',
    plan: 'Pro',
    tenureMonths: 9,
    mrr: 99,
    risk: 71,
    days: 33,
    daysLo: 19,
    daysHi: 55,
    reason: 'Dissatisfaction',
    drivers: ['Never scheduled a report', 'Sessions per week down 40%', 'Ticket about missing chart types'],
    recs: ['R1'],
    timeline: [],
  },
  {
    id: 'ACC-14420',
    name: 'Halcyon Health',
    segment: 'enterprise',
    plan: 'Enterprise',
    tenureMonths: 31,
    mrr: 1_480,
    risk: 63,
    days: 45,
    daysLo: 28,
    daysHi: 70,
    reason: 'Dissatisfaction',
    drivers: ['Admin shares no dashboards with team', 'Active seats down from 42 to 19', 'Renewal in 52 days'],
    recs: ['R4'],
    timeline: [],
  },
  {
    id: 'ACC-30988',
    name: 'Tidewater Supply',
    segment: 'starters',
    plan: 'Starter',
    tenureMonths: 2,
    mrr: 49,
    risk: 77,
    days: 21,
    daysLo: 12,
    daysHi: 36,
    reason: 'Dissatisfaction',
    drivers: ['Onboarding stalled at step 1 of 5', 'No login in 11 days'],
    recs: ['R2'],
    timeline: [],
  },
  {
    id: 'ACC-22156',
    name: 'Lumen & Oak',
    segment: 'smb',
    plan: 'Pro',
    tenureMonths: 18,
    mrr: 79,
    risk: 58,
    days: 52,
    daysLo: 31,
    daysHi: 80,
    reason: 'Payment',
    drivers: ['Card expires this month', 'Downgraded from 4 seats to 2'],
    recs: ['R5'],
    timeline: [],
  },
  {
    id: 'ACC-19802',
    name: 'Quarry Robotics',
    segment: 'growth',
    plan: 'Business',
    tenureMonths: 15,
    mrr: 310,
    risk: 54,
    days: 57,
    daysLo: 34,
    daysHi: 88,
    reason: 'Dissatisfaction',
    drivers: ['Slack not connected', 'Dashboard views down 22%'],
    recs: ['R3'],
    timeline: [],
  },
  {
    id: 'ACC-25510',
    name: 'Fernway Travel',
    segment: 'smb',
    plan: 'Starter',
    tenureMonths: 6,
    mrr: 39,
    risk: 66,
    days: 31,
    daysLo: 17,
    daysHi: 50,
    reason: 'Payment',
    drivers: ['Payment failed on last invoice', 'Asked support about cheaper plans'],
    recs: ['R5'],
    timeline: [],
  },
  {
    id: 'ACC-12077',
    name: 'Vantage Freight',
    segment: 'power',
    plan: 'Business',
    tenureMonths: 27,
    mrr: 640,
    risk: 42,
    days: 74,
    daysLo: 45,
    daysHi: 110,
    reason: 'Dissatisfaction',
    drivers: ['API error rate up after last release', 'Two escalated tickets'],
    recs: [],
    timeline: [],
  },
]

// Fill in plausible timelines for accounts without a hand-written one.
for (const a of accounts) {
  if (a.timeline.length) continue
  a.timeline =
    a.reason === 'Payment'
      ? [
          { date: 'Oct 6', kind: 'payment', text: `Payment failed: $${a.mrr.toFixed(2)} (card declined)`, tone: 'bad' },
          { date: 'Oct 3', kind: 'payment', text: 'Automatic retry scheduled', tone: 'bad' },
          { date: 'Sep 22', kind: 'usage', text: 'Usage steady: weekly sessions within normal range' },
          { date: 'Sep 3', kind: 'payment', text: `Invoice paid: $${a.mrr.toFixed(2)}`, tone: 'good' },
          { date: 'Aug 19', kind: 'csat', text: 'CSAT survey: 4 / 5', tone: 'good' },
        ]
      : [
          { date: 'Oct 5', kind: 'usage', text: a.drivers[0], tone: 'bad' },
          { date: 'Sep 29', kind: 'support', text: 'Ticket opened about a missing capability', tone: 'bad' },
          { date: 'Sep 20', kind: 'csat', text: 'CSAT survey: 3 / 5' },
          { date: 'Sep 3', kind: 'payment', text: `Invoice paid: $${a.mrr.toFixed(2)}`, tone: 'good' },
          { date: 'Aug 14', kind: 'usage', text: 'Peak usage this quarter', tone: 'good' },
        ]
}

export const accountById = Object.fromEntries(accounts.map((a) => [a.id, a])) as Record<string, Account>

/** Probability (%) the account is still subscribed after `day` days. */
export function accountSurvival(a: Account) {
  const lambda = Math.log(2) / a.days
  return Array.from({ length: 13 }, (_, i) => {
    const day = i * 10
    return { day, account: Math.round(Math.exp(-lambda * day) * 1000) / 10, segment: segmentCurve(a.segment, day) }
  })
}

function segmentCurve(seg: SegmentId, day: number) {
  const lambda = -Math.log(survivalAt90[seg]) / 90
  return Math.round(Math.exp(-lambda * day) * 1000) / 10
}

/* ------------------------------------------------------------------ */
/* Anomalies                                                           */
/* ------------------------------------------------------------------ */

export type Anomaly = {
  id: string
  tone: 'bad' | 'warn' | 'good' | 'failed'
  title: string
  detail: string
  when: string
  segment?: SegmentId
  link?: { label: string; to: string }
  retryActionId?: string
}

export const anomalies: Anomaly[] = [
  { id: 'a1', tone: 'bad', title: 'Scheduled Reports usage −23% over 4 weeks', detail: 'SMB Self-Serve. Strongest single driver of the risk increase.', when: '2h ago', segment: 'smb', link: { label: 'See segment', to: '/segments?segment=smb' } },
  { id: 'a2', tone: 'bad', title: 'Sessions per week −18%', detail: 'SMB Self-Serve, down from 5.6 to 4.6 per account since week 8.', when: '2h ago', segment: 'smb', link: { label: 'See trend', to: '/segments?segment=smb' } },
  { id: 'a3', tone: 'warn', title: 'Support tickets +12%', detail: 'SMB Self-Serve. Mostly about slow exports.', when: '2h ago', segment: 'smb', link: { label: 'See accounts', to: '/churn-risk' } },
  { id: 'a4', tone: 'failed', title: 'Win-back offer failed to send', detail: 'Email provider timed out after 30s. 210 accounts not reached.', when: '3h ago', retryActionId: 'L2' },
  { id: 'a5', tone: 'good', title: 'Onboarding checklist v2 trending positive', detail: '+3.2 pts vs control at day 12 of 21. Likely a real effect.', when: '6h ago', segment: 'starters', link: { label: 'See experiment', to: '/actions' } },
]

/* ------------------------------------------------------------------ */
/* Actions & impact                                                    */
/* ------------------------------------------------------------------ */

export type LogStatus = 'Executed' | 'Failed' | 'Dry-run' | 'Queued' | 'Running'

export type ActionLogRow = {
  id: string
  time: string
  recommendation: string
  recId?: string
  type: ActionType
  segment: SegmentId
  approvedBy: string
  status: LogStatus
  accounts: number
  result?: string
  error?: string
  payload: Record<string, unknown>
}

export const actionLog: ActionLogRow[] = [
  {
    id: 'L2',
    time: '3h ago',
    recommendation: 'Win-back offer',
    type: 'Targeted email',
    segment: 'smb',
    approvedBy: 'Arjun M.',
    status: 'Failed',
    accounts: 210,
    error: 'Email provider timed out after 30s',
    payload: { action: 'send_email', provider: 'sendgrid', template_id: 'winback_20off_v3', audience: { segment: 'smb_self_serve', risk_min: 0.6, accounts: 210 }, error: { code: 'ETIMEDOUT', after_ms: 30000 } },
  },
  {
    id: 'L5',
    time: '1 day ago',
    recommendation: 'Slack connect nudge',
    type: 'UI guide',
    segment: 'power',
    approvedBy: 'Priya S.',
    status: 'Dry-run',
    accounts: 380,
    result: 'Would show to 380 accounts',
    payload: { action: 'show_ui_guide', guide_id: 'slack_connect_nudge', target_page: '/integrations', audience: { segment: 'power_integrators', accounts: 380 }, dry_run: true },
  },
  {
    id: 'L4',
    time: '5 days ago',
    recommendation: 'Renewal reminder email',
    type: 'Targeted email',
    segment: 'enterprise',
    approvedBy: 'Arjun M.',
    status: 'Executed',
    accounts: 96,
    result: '58% opened · 11 renewals confirmed early',
    payload: { action: 'send_email', provider: 'sendgrid', template_id: 'renewal_reminder_ent', audience: { segment: 'enterprise_admins', renewal_within_days: 60, accounts: 96 } },
  },
  {
    id: 'L3',
    time: '12 days ago',
    recommendation: 'Onboarding checklist v2',
    type: 'A/B test',
    segment: 'starters',
    approvedBy: 'Priya S.',
    status: 'Executed',
    accounts: 1200,
    result: 'Running · +3.2 pts vs control at day 12',
    payload: { action: 'start_experiment', experiment_id: 'onb_checklist_v2', split: { control: 0.5, variant: 0.5 }, duration_days: 21, metric: 'retention_30d', audience: { segment: 'low_engagement_starters', accounts: 1200 } },
  },
  {
    id: 'L1',
    time: '18 days ago',
    recommendation: 'Dashboard-sharing tip',
    type: 'UI guide',
    segment: 'growth',
    approvedBy: 'Priya S.',
    status: 'Executed',
    accounts: 1420,
    result: 'Churn 4.6% → 3.7% (control 4.5%) · Worked',
    payload: { action: 'show_ui_guide', guide_id: 'dashboard_sharing_tip', target_page: '/dashboards/:id', audience: { segment: 'growth_teams', accounts: 1420 } },
  },
]

export const actionStats = [
  { label: 'Actions executed (30d)', value: '14', hint: 'Approved actions that ran for real in the last 30 days.' },
  { label: 'Success rate', value: '93%', hint: '13 of 14 actions completed without errors. The failed one can be retried.' },
  { label: 'Median time to execute', value: '6 min', hint: 'From approval to the action reaching customers.' },
  { label: 'MRR retained so far', value: '$6.4k', hint: 'Estimated from accounts that stayed versus a matched control group.' },
]

export const approvers = [
  { name: 'Priya S.', initials: 'PS', title: 'Growth Manager', role: 'Admin · Approver', email: 'priya@acme.io' },
  { name: 'Arjun M.', initials: 'AM', title: 'Product Manager', role: 'Approver', email: 'arjun@acme.io' },
]

export const currentUser = approvers[0]

export const experiment = {
  name: 'Onboarding checklist v2',
  segment: 'starters' as SegmentId,
  day: 12,
  duration: 21,
  metric: '30-day retention',
  variants: [
    { name: 'Control (v1)', value: 61.8, accounts: 600 },
    { name: 'Checklist v2', value: 65.0, accounts: 600 },
  ],
  diff: 3.2,
  p: 0.04,
  verdict: 'Likely real effect',
}

export const outcome = {
  name: 'Dashboard-sharing tip',
  segment: 'growth' as SegmentId,
  before: 4.6,
  after: 3.7,
  control: 4.5,
  verdict: 'Worked',
  series: [
    { week: 'W−4', target: 4.6, control: 4.5 },
    { week: 'W−3', target: 4.7, control: 4.6 },
    { week: 'W−2', target: 4.5, control: 4.4 },
    { week: 'W−1', target: 4.6, control: 4.5 },
    { week: 'Launch', target: 4.5, control: 4.5 },
    { week: 'W+1', target: 4.2, control: 4.6 },
    { week: 'W+2', target: 4.0, control: 4.4 },
    { week: 'W+3', target: 3.8, control: 4.5 },
    { week: 'W+4', target: 3.7, control: 4.5 },
  ],
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

export const agents = [
  { id: 'ingest', name: 'Data ingestion', short: 'Ingestion', duration: '3m 12s' },
  { id: 'behavior', name: 'User Behavior agent', short: 'Clustering', duration: '1m 48s' },
  { id: 'risk', name: 'Churn Risk agent', short: 'Churn prediction', duration: '2m 05s' },
  { id: 'causal', name: 'Causal Feature Impact agent', short: 'Feature analysis', duration: '4m 31s' },
  { id: 'strategy', name: 'Strategy agent (LLM)', short: 'Recommendations', duration: '0m 52s' },
  { id: 'action', name: 'Action agent', short: 'Action execution', duration: '0m 18s' },
]

export const dataSources = [
  { name: 'Billing', vendor: 'Stripe', status: 'OK' as const, detail: '12,480 subscriptions · synced 2h ago' },
  { name: 'Product usage', vendor: 'Segment events', status: 'OK' as const, detail: '18.2M events (90d) · synced 2h ago' },
  { name: 'Support', vendor: 'Zendesk', status: 'Warning' as const, detail: '4% of tickets missing account ID' },
  { name: 'CRM', vendor: 'HubSpot', status: 'OK' as const, detail: '12,391 companies matched · synced 2h ago' },
  { name: 'Demo dataset', vendor: 'Built-in mock', status: 'OK' as const, detail: 'Used for fields not yet connected' },
]

export const canonicalFields = ['account_id', 'plan', 'mrr', 'signup_date', 'seats', 'event_name', 'event_time', 'ticket_created_at', 'csat_score', 'payment_status']

export const schemaMappings = [
  { source: 'Stripe', field: 'customer.id', canonical: 'account_id', match: 'OK' as const },
  { source: 'Stripe', field: 'subscription.plan.nickname', canonical: 'plan', match: 'OK' as const },
  { source: 'Stripe', field: 'subscription.items.amount', canonical: 'mrr', match: 'Derived' as const },
  { source: 'Segment', field: 'track.event', canonical: 'event_name', match: 'OK' as const },
  { source: 'Segment', field: 'track.timestamp', canonical: 'event_time', match: 'OK' as const },
  { source: 'Zendesk', field: 'ticket.organization_id', canonical: 'account_id', match: 'Needs review' as const },
  { source: 'Zendesk', field: 'satisfaction_rating.score', canonical: 'csat_score', match: 'Derived' as const },
  { source: 'HubSpot', field: 'company.num_seats__c', canonical: 'seats', match: 'OK' as const },
]

export const dataQuality = [
  { label: 'Accounts matched across sources', value: '99.3%', tone: 'good' as const, hint: '12,391 of 12,480 accounts found in all core sources.' },
  { label: 'Missing values', value: '1.8%', tone: 'good' as const, hint: 'Share of required fields that are empty. Below 5% is healthy.' },
  { label: 'Unmatched support tickets', value: '4.0%', tone: 'warn' as const, hint: 'Tickets we could not link to an account. Fix the Zendesk mapping to improve this.' },
  { label: 'Data freshness', value: '2h', tone: 'good' as const, hint: 'Time since the most recent sync of all sources.' },
]

export const runHistory = [
  { id: 'run-0412', started: 'Today 06:00', duration: '12m 46s', status: 'OK' as const, note: 'All six stages completed' },
  { id: 'run-0411', started: 'Yesterday 06:00', duration: '8m 03s', status: 'Failed' as const, note: 'Failed at Feature analysis: out of memory (retried manually)' },
  { id: 'run-0410', started: 'Oct 7, 06:00', duration: '12m 31s', status: 'OK' as const, note: 'All six stages completed' },
  { id: 'run-0409', started: 'Oct 6, 06:00', duration: '12m 58s', status: 'OK' as const, note: 'All six stages completed' },
  { id: 'run-0408', started: 'Oct 5, 06:00', duration: '13m 10s', status: 'OK' as const, note: 'Support source warning: 4% unmatched tickets' },
]

export const integrations = [
  { name: 'SendGrid', purpose: 'Targeted emails', status: 'Connected', credential: 'SG.live_9fd3b20e4f2a', live: false },
  { name: 'Stripe', purpose: 'Pricing changes', status: 'Connected', credential: 'sk_live_51Hx77c04f2a', live: false },
  { name: 'In-app guides', purpose: 'UI guides', status: 'Connected', credential: 'ig_key_7a1180c94f2a', live: true },
  { name: 'Experiments', purpose: 'A/B tests', status: 'Connected', credential: 'exp_tok_e02bb5114f2a', live: true },
]
