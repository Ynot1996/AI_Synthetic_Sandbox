const BASE = 'http://localhost:8000'

export async function runAudit(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/audit`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Audit failed')
  }
  return res.json()
}

// Returns an EventSource-like async generator over SSE events
export async function* streamAudit(file) {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE}/api/audit/stream`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Stream failed')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop()           // keep incomplete chunk
    for (const block of lines) {
      const line = block.trim()
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6))
        } catch { /* skip malformed */ }
      }
    }
  }
}
