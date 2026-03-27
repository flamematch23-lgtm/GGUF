import 'dotenv/config'
import express from 'express'
import { LlamaChatSession, LlamaModel } from 'node-llama-cpp'
import { clientOrigin, modelPath, port } from './config.mjs'

const app = express()

let model

if (modelPath) {
  model = new LlamaModel({ modelPath })
}

app.use(express.json())
app.use((req, res, next) => {
  const origin = req.headers.origin || ''
  const allowed =
    process.env.NODE_ENV === 'production'
      ? origin === clientOrigin
      : /^https?:\/\/localhost(:\d+)?$/.test(origin)
  if (allowed) res.header('Access-Control-Allow-Origin', origin)
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, modelPath: Boolean(modelPath) })
})

app.post('/api/chat', async (req, res) => {
  if (!model) {
    return res.status(503).json({ error: 'Model not available' })
  }

  const { messages } = req.body

  if (!messages) {
    return res.status(400).json({ error: 'Missing messages in request body' })
  }

  const session = new LlamaChatSession({ model })
  const stream = await session.prompt(messages, {
    temperature: 0.7,
  })

  res.type('text/event-stream')

  for await (const chunk of stream) {
    res.write(chunk)
  }

  res.end()
})

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
