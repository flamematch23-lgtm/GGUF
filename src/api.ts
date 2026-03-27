import { apiBaseUrl } from './config'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatRequest = {
  message: string
  model: string
  temperature: number
  max_tokens: number
  conversation_history?: ChatMessage[]
}

export async function getHealth() {
  const response = await fetch(`${apiBaseUrl}/api/health`)
  if (!response.ok) {
    throw new Error('Health check failed')
  }
  return response.json()
}

export async function getModels() {
  const response = await fetch(`${apiBaseUrl}/api/models`)
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  return response.json()
}

export async function getUsage() {
  const response = await fetch(`${apiBaseUrl}/api/usage`)
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  return response.json()
}

export async function sendChat(payload: ChatRequest) {
  const response = await fetch(`${apiBaseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json()
}

async function readError(response: Response) {
  try {
    const data = await response.json()
    return data.error || JSON.stringify(data)
  } catch {
    return `${response.status} ${response.statusText}`
  }
}
