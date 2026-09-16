import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

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
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
    affordances: string[]
    [key: string]: unknown
  }
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
          const started = performance.now()
          const criteria = Object.fromEntries(
            event.affordances.map((name) => [name, descriptions[name] ?? null]),
          )

          const upstream = await fetch('https://api.typesafe.ai/v1/systemone', {
            method: 'POST',
            headers: {
              authorization: `Bearer ${apiKey}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              state: event,
              model: 'jev-latest',
              questions: {
                next_component: {
                  type: 'choice',
                  instructions:
                    'Choose the single UI affordance that should be presented next. Use the target label, semantic position, nearby text, current world state, and previous surface. Prefer the action that best advances the apparent user intent without inventing capabilities.',
                  criteria,
                },
                ambiguous_intent: {
                  type: 'noul',
                  instructions:
                    'Is the user intent too ambiguous to confidently infer a next UI affordance from this event and state?',
                },
                requires_confirmation: {
                  type: 'noul',
                  instructions:
                    'Would acting on the apparent intent likely require explicit user confirmation because it could be consequential, irreversible, or costly?',
                },
              },
            }),
          })

          const payload = (await upstream.json()) as {
            model?: string
            answers?: {
              next_component?: {
                type: 'choice'
                choice: string
                probabilities: Record<string, number>
                confidence: number
              }
              ambiguous_intent?: { type: 'noul'; noul: number }
              requires_confirmation?: { type: 'noul'; noul: number }
            }
            [key: string]: unknown
          }

          if (!upstream.ok || !payload.answers?.next_component) {
            sendJson(res, upstream.status, payload)
            return
          }

          const answer = payload.answers.next_component
          const candidates = Object.entries(answer.probabilities)
            .map(([component, probability]) => ({ component, probability }))
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 4)

          const ambiguity = payload.answers.ambiguous_intent?.noul ?? 0
          const confirmation = payload.answers.requires_confirmation?.noul ?? 0
          const component = answer.choice

          sendJson(res, 200, {
            action: {
              type: 'present',
              component,
              reason: `Jev selected ${component} from the registered affordance catalog.`,
            },
            confidence: answer.confidence,
            candidates,
            rationale: `ambiguity=${ambiguity.toFixed(3)} · confirmation=${confirmation.toFixed(3)}`,
            model: payload.model ?? 'jev-latest',
            latencyMs: Math.round(performance.now() - started),
          })
        } catch (error) {
          sendJson(res, 500, {
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
    },
  }
})
