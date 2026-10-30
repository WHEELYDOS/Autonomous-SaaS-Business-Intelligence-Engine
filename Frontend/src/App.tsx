import { RouterProvider } from 'react-router'
import { AppStateProvider } from '@/state/AppState'
import { router } from './routes'

export default function App() {
  return (
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  )
}
