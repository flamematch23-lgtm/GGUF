import { useEffect, useRef, useState } from 'react'
import { type ChatMessage, getHealth, getModels, getUsage, sendChat } from './api'

type ModelInfo = { id: string; name: string; context?: number }

type ModelsResponse =
  | { models?: Array<{ id?: string; name?: string; context_window?: number }> }
  | Array<{ id?: string; name?: string; context_window?: number }>

export default function App() {
  const [health, setHealth] = useState<{ ok: boolean; hasApiKey: boolean } | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [usage, setUsage] = useState<{ tokens_used?: number; tokens_remaining?: number } | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState('wormgpt-v2')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [h, m, u] = await Promise.all([getHealth(), getModels(), getUsage()])
        if (!active) return
        setHealth(h)
        setModels(normalizeModels(m))
        setUsage(u)
      } catch {
        if (active) setError('Backend non raggiungibile. Avvia npm run api.')
      }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const data = await sendChat({
        message: text,
        model,
        temperature,
        max_tokens: maxTokens,
        conversation_history: messages,
      })

      const reply = data?.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2)
      setMessages([...next, { role: 'assistant', content: reply }])

      if (data?.usage) {
        setUsage({
          tokens_used: data.usage.tokens_used ?? data.usage.prompt_tokens,
          tokens_remaining: data.usage.tokens_remaining,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Richiesta non riuscita')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function clearChat() {
    setMessages([])
    setError('')
  }

  const statusOk = health?.ok && health.hasApiKey

  return (
    <div className="app-layout">
      {/* ─── sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h1 className="logo">GGUF</h1>
          <div className={`status-pill ${statusOk ? 'ok' : 'warn'}`}>
            <span className="status-dot" />
            {statusOk ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Modello</label>
          <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
            {models.length > 0
              ? models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)
              : <option value="wormgpt-v2">WormGPT v2</option>}
          </select>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Temperature: {temperature}</label>
          <input
            type="range"
            className="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Max tokens</label>
          <input
            type="number"
            className="field"
            min="100"
            max="128000"
            step="100"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
          />
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Utilizzo</label>
          <p className="sidebar-meta">Usati: {usage?.tokens_used?.toLocaleString() ?? '—'}</p>
          <p className="sidebar-meta">Residui: {usage?.tokens_remaining?.toLocaleString() ?? '—'}</p>
        </div>

        <div className="sidebar-bottom">
          <button className="btn-outline" onClick={clearChat} type="button">Nuova chat</button>
        </div>
      </aside>

      {/* ─── main chat ─── */}
      <main className="chat-main">
        <div className="messages-scroll">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>Scrivi un messaggio per iniziare</p>
              <p className="sidebar-meta">La chiave API resta nel backend locale</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <div className="msg-avatar">{msg.role === 'user' ? 'Tu' : 'AI'}</div>
              <div className="msg-body">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="msg assistant">
              <div className="msg-avatar">AI</div>
              <div className="msg-body typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && <div className="chat-error">{error}</div>}

        <form className="chat-input-bar" onSubmit={(e) => { e.preventDefault(); send() }}>
          <textarea
            className="chat-textarea"
            placeholder="Scrivi un messaggio… (Shift+Enter per a capo)"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="btn-send" disabled={loading || !input.trim()} type="submit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </main>
    </div>
  )
}

function normalizeModels(input: ModelsResponse): ModelInfo[] {
  const items = Array.isArray(input) ? input : input.models ?? []
  return items.map((m) => ({
    id: m.id || m.name || 'unknown',
    name: m.name || m.id || 'Unknown',
    context: m.context_window,
  }))
}
