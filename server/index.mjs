import 'dotenv/config'
import express from 'express'
import { getLlama, LlamaChatSession } from 'node-llama-cpp'
import { clientOrigin, modelPath, port } from './config.mjs'

const app = express()

let llamaModel = null

async function initModel() {
  if (!modelPath) return
  try {
    const llama = await getLlama()
    llamaModel = await llama.loadModel({ modelPath })
    console.log('Model loaded:', modelPath)
  } catch (err) {
    console.error('Failed to load model:', err.message)
  }
}

await initModel()

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
  res.json({ ok: true, hasApiKey: Boolean(llamaModel) })
})

app.get('/api/models', (_req, res) => {
  if (!llamaModel) {
    return res.json({ models: [] })
  }
  const fileName = modelPath.split(/[\\/]/).pop().replace(/\.gguf$/i, '')
  res.json({ models: [{ id: fileName, name: fileName }] })
})

app.get('/api/usage', (_req, res) => {
  res.json({})
})

app.post('/api/chat', async (req, res) => {
  if (!llamaModel) {
    return res.status(503).json({ error: 'Model not available. Set MODEL_PATH in .env' })
  }

  const { message, conversation_history = [], temperature = 0.7, max_tokens = 2000 } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid message in request body' })
  }

  let context = null
  try {
    context = await llamaModel.createContext()
    const session = new LlamaChatSession({ contextSequence: context.getSequence() })

    if (conversation_history.length > 0) {
      const history = conversation_history.map((msg) =>
        msg.role === 'user'
          ? { type: 'user', text: msg.content }
          : { type: 'model', response: [msg.content] }
      )
      await session.setChatHistory(history)
    }

    const reply = await session.prompt(message, { temperature, maxTokens: max_tokens })

    res.json({
      choices: [{ message: { role: 'assistant', content: reply } }],
      usage: {},
    })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  } finally {
    if (context) await context.dispose()
  }
})

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`)
})
