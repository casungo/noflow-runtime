import type { PolicyDecision, SemanticEvent, SemanticPolicy } from './types'

/**
 * Production adapter.
 *
 * Keep model credentials server-side. Your endpoint receives a SemanticEvent and
 * returns a PolicyDecision. The browser never needs to know whether the policy
 * behind that endpoint is Jev, another classifier, or a deterministic service.
 */
export class HttpSemanticPolicy implements SemanticPolicy {
  constructor(private readonly endpoint = '/api/semantic-transition') {}

  async decide(event: SemanticEvent): Promise<PolicyDecision> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      throw new Error(`Semantic policy failed with ${response.status}`)
    }

    return response.json() as Promise<PolicyDecision>
  }
}
