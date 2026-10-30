import { createBrowserRouter } from 'react-router'
import AppShell from '@/layout/AppShell'
import Overview from '@/pages/Overview'
import Segments from '@/pages/Segments'
import ChurnRisk from '@/pages/ChurnRisk'
import FeatureImpact from '@/pages/FeatureImpact'
import Recommendations from '@/pages/Recommendations'
import Actions from '@/pages/Actions'
import Pipeline from '@/pages/Pipeline'
import SettingsPage from '@/pages/Settings'
import CustomerDetail from '@/pages/CustomerDetail'
import NotFound from '@/pages/NotFound'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: AppShell,
      children: [
        { index: true, Component: Overview },
        { path: 'segments', Component: Segments },
        { path: 'churn-risk', Component: ChurnRisk },
        { path: 'feature-impact', Component: FeatureImpact },
        { path: 'recommendations', Component: Recommendations },
        { path: 'actions', Component: Actions },
        { path: 'pipeline', Component: Pipeline },
        { path: 'settings/:section?', Component: SettingsPage },
        { path: 'accounts/:id', Component: CustomerDetail },
        { path: '*', Component: NotFound },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
