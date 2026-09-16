import type { SemanticEvent, SemanticPolicy } from './types'

function isEvent(value: unknown): value is SemanticEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<SemanticEvent>
  return Boolean(
    typeof event.id === 'string' &&
      typeof event.type === 'string' &&
      event.target &&
      typeof event.target === 'object' &&
      Array.isArray(event.affordances) &&
      event.world &&
      typeof event.world === 'object',
  )
}

export function createSemanticPolicyHandler(policy: SemanticPolicy) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return Response.json({ error: 'POST required' }, { status: 405 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    if (!isEvent(body)) {
      return Response.json({ error: 'Invalid semantic event' }, { status: 400 })
    }

    try {
      return Response.json(await policy.decide(body))
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Semantic policy error' },
        { status: 502 },
      )
    }
  }
}
