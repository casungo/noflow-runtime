export type PrimitiveName = string

export type SemanticTarget = {
  id: string
  role: 'button' | 'link' | 'input' | 'surface'
  label: string
  description?: string
  position?: 'primary' | 'secondary' | 'footer'
}

export type WorldState = Record<string, unknown>

export type SemanticEvent<Surface extends string = string, World extends WorldState = WorldState> = {
  id: string
  type: 'activate' | 'submit' | 'change'
  at: number
  target: SemanticTarget
  nearbyText: string
  world: World
  affordances: Surface[]
}

export type UIAction<Surface extends string = string> =
  | {
      type: 'present'
      component: Surface
      reason: string
    }
  | {
      type: 'update-world'
      path: string
      value: unknown
      reason: string
    }
  | {
      type: 'noop'
      reason: string
    }

export type Candidate<Surface extends string = string> = {
  component: Surface
  probability: number
}

export type PolicyDecision<Surface extends string = string> = {
  action: UIAction<Surface>
  confidence: number
  candidates: Candidate<Surface>[]
  rationale: string
  model: string
  latencyMs: number
}

export type SemanticPolicy<Surface extends string = string, World extends WorldState = WorldState> = {
  decide(event: SemanticEvent<Surface, World>): Promise<PolicyDecision<Surface>>
}

export type TransitionLog<Surface extends string = string, World extends WorldState = WorldState> = {
  event: SemanticEvent<Surface, World>
  decision: PolicyDecision<Surface>
}
