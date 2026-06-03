import { useEffect, useState } from 'react'

function apiRoot(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (configured) return configured.replace(/\/api\/?$/, '')
  return 'http://localhost:5001'
}

async function checkHealth(): Promise<boolean> {
  const res = await fetch(`${apiRoot()}/health`, { method: 'GET' })
  return res.ok
}

async function checkWithRetries(): Promise<boolean> {
  const delays = [0, 8000, 20000]
  for (const delay of delays) {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
    try {
      if (await checkHealth()) return true
    } catch {
      /* retry — Render cold start or CORS */
    }
  }
  return false
}

export default function ApiStatusBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false

    void checkWithRetries().then((ok) => {
      if (!cancelled) setOffline(!ok)
    })

    const id = setInterval(() => {
      void checkHealth()
        .then((ok) => { if (!cancelled) setOffline(!ok) })
        .catch(() => { if (!cancelled) setOffline(true) })
    }, 60000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (!offline) return null

  const isProd = Boolean(import.meta.env.VITE_API_BASE_URL)

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-sm font-semibold py-2 px-4 z-[100]">
      {isProd ? (
        <>
          API unreachable at{' '}
          <code className="font-mono bg-amber-600/20 px-1 rounded">{apiRoot()}</code>
          . Render may be waking up (wait ~1 min), or update{' '}
          <code className="font-mono bg-amber-600/20 px-1 rounded">FRONTEND_URL</code> on Render to your Vercel URL.
        </>
      ) : (
        <>
          Cannot reach the API — run{' '}
          <code className="font-mono bg-amber-600/20 px-1 rounded">npm run dev</code> in the{' '}
          <code className="font-mono bg-amber-600/20 px-1 rounded">backend</code> folder.
        </>
      )}
    </div>
  )
}
