import type { PolicyDecision, PrimitiveName, SemanticEvent, SemanticPolicy, WorldState } from './types'

/**
 * Production adapter.
 *
 * Keep model credentials server-side. Your endpoint receives a SemanticEvent and
 * returns a PolicyDecision. The browser never needs to know whether the policy
 * behind that endpoint is Jev, another classifier, or a deterministic service.
 */
export class HttpSemanticPolicy<
  Surface extends string = PrimitiveName,
  World extends WorldState = WorldState,
> implements SemanticPolicy<Surface, World> {
  constructor(private readonly endpoint = '/api/semantic-transition') {}

  async decide(event: SemanticEvent<Surface, World>): Promise<PolicyDecision<Surface>> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      throw new Error(`Semantic policy failed with ${response.status}`)
    }

    return response.json() as Promise<PolicyDecision<Surface>>
  }
}
