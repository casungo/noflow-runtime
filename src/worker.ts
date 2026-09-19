import { createSemanticPolicyHandler, JevSemanticPolicy } from './server'

const descriptions = {
  checkout: 'A purchase, subscription, payment, or upgrade surface.',
  comparison: 'A side-by-side plan or product comparison surface.',
  trial: 'A free trial or low-commitment product exploration surface.',
  support: 'A help, support, or human-assistance surface.',
  login: 'An authentication or sign-in surface.',
  dashboard: 'The signed-in workspace or primary product surface.',
  details: 'An explanatory surface with more product information.',
  welcome: 'A neutral landing or reset surface.',
} as const

type WorkerEnv = Cloudflare.Env & { TYPESAFE_API_KEY: string }

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/semantic-transition') {
      if (!env.TYPESAFE_API_KEY) {
        return Response.json({ error: 'TYPESAFE_API_KEY is not configured' }, { status: 503 })
      }

      return createSemanticPolicyHandler(
        new JevSemanticPolicy({ apiKey: env.TYPESAFE_API_KEY, descriptions }),
      )(request)
    }

    return env.ASSETS.fetch(request)
  },
}
