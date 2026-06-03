import { useEffect, useState } from 'react'

function apiRoot(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (configured) return configured.replace(/\/api\/?$/, '')
  return 'http://localhost:5001'
}

export default function ApiStatusBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await fetch(`${apiRoot()}/health`)
        if (!cancelled) setOffline(!res.ok)
      } catch {
        if (!cancelled) setOffline(true)
      }
    }

    void check()
    const id = setInterval(() => void check(), 30000)
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
        <>Cannot reach the API at <code className="font-mono bg-amber-600/20 px-1 rounded">{apiRoot()}</code> — check Render is running and <code className="font-mono bg-amber-600/20 px-1 rounded">VITE_API_BASE_URL</code> on Vercel.</>
      ) : (
        <>Cannot reach the API — run <code className="font-mono bg-amber-600/20 px-1 rounded">npm run dev</code> in the <code className="font-mono bg-amber-600/20 px-1 rounded">backend</code> folder.</>
      )}
    </div>
  )
}
