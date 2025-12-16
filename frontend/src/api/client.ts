const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    let detail: unknown
    try {
      detail = await res.json()
    } catch {
      detail = await res.text()
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

export { API_BASE }

// helper POST con timeout opcional y JSON por defecto
export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  opts?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, opts?.timeoutMs ?? 7000))
  try {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      let detail: unknown
      try {
        detail = await res.json()
      } catch {
        detail = await res.text()
      }
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) return (await res.json()) as T
    return (await res.text()) as unknown as T
  } finally {
    clearTimeout(timeout)
  }
}
