import type {
  Candidate,
  PolicyDecision,
  SemanticEvent,
  SemanticPolicy,
  WorldState,
} from './types'

type JevAnswer = {
  type: 'choice'
  choice: string
  probabilities: Record<string, number>
  confidence: number
}

type JevResponse = {
  model?: string
  answers?: {
    next_component?: JevAnswer
    ambiguous_intent?: { noul: number }
    requires_confirmation?: { noul: number }
  }
}

export type JevSemanticPolicyOptions<Surface extends string> = {
  apiKey: string
  descriptions?: Partial<Record<Surface, string>>
  endpoint?: string
  model?: string
}

export class JevSemanticPolicy<
  Surface extends string = string,
  World extends WorldState = WorldState,
> implements SemanticPolicy<Surface, World> {
  private readonly endpoint: string
  private readonly model: string

  constructor(private readonly options: JevSemanticPolicyOptions<Surface>) {
    this.endpoint = options.endpoint ?? 'https://api.typesafe.ai/v1/systemone'
    this.model = options.model ?? 'jev-latest'
  }

  async decide(event: SemanticEvent<Surface, World>): Promise<PolicyDecision<Surface>> {
    const started = performance.now()
    const criteria = Object.fromEntries(
      event.affordances.map((name) => [name, this.options.descriptions?.[name] ?? name]),
    )
    const upstream = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        state: event,
        model: this.model,
        questions: {
          next_component: {
            type: 'choice',
            instructions:
              'Choose the single UI affordance that should be presented next from the registered catalog. Use the target label, semantic position, nearby text, world state, and previous surface.',
            criteria,
          },
          ambiguous_intent: {
            type: 'noul',
            instructions: 'Is the intent too ambiguous to infer the next affordance?',
          },
          requires_confirmation: {
            type: 'noul',
            instructions: 'Would this intent likely require explicit confirmation because it is consequential, irreversible, or costly?',
          },
        },
      }),
    })

    const payload = (await upstream.json()) as JevResponse
    const answer = payload.answers?.next_component
    if (!upstream.ok || !answer) {
      throw new Error(`Jev policy failed with ${upstream.status}`)
    }

    const choice = answer.choice as Surface
    if (!event.affordances.includes(choice)) {
      throw new Error(`Jev returned an unregistered affordance: ${answer.choice}`)
    }

    const candidates = Object.entries(answer.probabilities)
      .filter(([component]) => event.affordances.includes(component as Surface))
      .map(([component, probability]) => ({ component: component as Surface, probability }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 4) as Candidate<Surface>[]
    const ambiguity = payload.answers?.ambiguous_intent?.noul ?? 0
    const confirmation = payload.answers?.requires_confirmation?.noul ?? 0

    return {
      action: {
        type: 'present',
        component: choice,
        reason: `Jev selected ${choice} from the registered affordance catalog.`,
      },
      confidence: answer.confidence,
      candidates,
      rationale: `ambiguity=${ambiguity.toFixed(3)} · confirmation=${confirmation.toFixed(3)}`,
      model: payload.model ?? this.model,
      latencyMs: Math.round(performance.now() - started),
    }
  }
}
