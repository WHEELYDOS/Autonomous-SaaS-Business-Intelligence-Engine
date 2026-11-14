/**
 * BackendStatus — a slim banner that shows whether the FastAPI backend
 * is reachable. It appears at the top of the page only when something
 * is wrong (offline) or when data is being loaded for the first time.
 *
 * When the backend is healthy and data is loaded it renders nothing,
 * keeping the UI clean in the normal case.
 */

import { useEffect, useState } from 'react'
import { api, IS_MOCK_MODE } from '@/lib/api'
import { AlertTriangle, CheckCircle2, Loader2, WifiOff } from 'lucide-react'

type Conn = 'checking' | 'online' | 'offline' | 'mock'

export default function BackendStatus() {
  const [conn, setConn] = useState<Conn>('checking')
  const [detail, setDetail] = useState<string>('')

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setConn('mock')
      return
    }

    let timer: ReturnType<typeof setTimeout>

    async function check() {
      try {
        const s = await api.status()
        setConn('online')
        setDetail(s.loaded_at ? `Last pipeline run: ${new Date(s.loaded_at).toLocaleString()}` : 'Pipeline not yet run')
      } catch (err: unknown) {
        setConn('offline')
        setDetail(err instanceof Error ? err.message : 'Cannot reach backend')
      }
      // Re-check every 30 s
      timer = setTimeout(check, 30_000)
    }

    check()
    return () => clearTimeout(timer)
  }, [])

  if (conn === 'online') return null // don't clutter the UI when all is well

  const banners: Record<Conn, { bg: string; icon: React.ReactNode; text: string }> = {
    checking: {
      bg: 'bg-dark-teal/40 border-dark-cyan/30 text-pearl-aqua',
      icon: <Loader2 size={14} className="animate-spin text-dark-cyan" />,
      text: 'Connecting to backend…',
    },
    online: {
      bg: 'bg-dark-cyan/20 border-dark-cyan/40 text-pearl-aqua',
      icon: <CheckCircle2 size={14} className="text-pearl-aqua" />,
      text: 'Backend connected',
    },
    offline: {
      bg: 'bg-oxidized-iron/20 border-oxidized-iron/40 text-wheat',
      icon: <WifiOff size={14} className="text-oxidized-iron" />,
      text: `Backend offline — showing static data. ${detail}`,
    },
    mock: {
      bg: 'bg-burnt-caramel/20 border-burnt-caramel/40 text-wheat',
      icon: <AlertTriangle size={14} className="text-golden-orange" />,
      text: 'Running in mock mode — no backend required. Set VITE_USE_MOCK=false to connect.',
    },
  }

  const { bg, icon, text } = banners[conn]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 border-b px-4 py-1.5 text-xs font-medium ${bg}`}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {icon}
      <span className="text-fg-2">{text}</span>
      {conn === 'offline' && (
        <a
          href="https://github.com#run-backend"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 font-semibold text-accent hover:underline"
        >
          How to start the server →
        </a>
      )}
    </div>
  )
}
