import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { JevSemanticPolicy } from './src/runtime/jevPolicy'
import type { SemanticEvent } from './src/runtime/types'

const descriptions: Record<string, string> = {
  checkout: 'A purchase, subscription, payment, or upgrade surface.',
  comparison: 'A side-by-side plan or product comparison surface.',
  trial: 'A free trial or low-commitment product exploration surface.',
  support: 'A help, support, or human-assistance surface.',
  login: 'An authentication or sign-in surface.',
  dashboard: 'The signed-in workspace or primary product surface.',
  details: 'An explanatory surface with more product information.',
  welcome: 'A neutral landing or reset surface.',
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as SemanticEvent
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

function semanticPolicyApi(apiKey: string | undefined): Plugin {
  return {
    name: 'noflow-semantic-policy-api',
    configureServer(server) {
      const policy = new JevSemanticPolicy({ apiKey: apiKey ?? '', descriptions })

      server.middlewares.use('/api/semantic-transition', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'POST required' })
          return
        }

        if (!apiKey) {
          sendJson(res, 503, {
            error: 'TYPESAFE_API_KEY is missing. Use VITE_POLICY_MODE=mock or add the key to .env.local.',
          })
          return
        }

        try {
          const event = await readJson(req)
          sendJson(res, 200, await policy.decide(event))
        } catch (error) {
          sendJson(res, 502, {
            error: error instanceof Error ? error.message : 'Unknown semantic policy error',
          })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), semanticPolicyApi(env.TYPESAFE_API_KEY)],
    server: {
      port: 5173,
      allowedHosts: true,
    },
  }
})
