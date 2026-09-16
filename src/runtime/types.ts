export type PrimitiveName =
  | 'checkout'
  | 'comparison'
  | 'trial'
  | 'support'
  | 'login'
  | 'dashboard'
  | 'details'
  | 'welcome'

export type SemanticTarget = {
  id: string
  role: 'button' | 'link' | 'input' | 'surface'
  label: string
  description?: string
  position?: 'primary' | 'secondary' | 'footer'
}

export type WorldState = {
  user: {
    loggedIn: boolean
    hasPaymentMethod: boolean
    trialUsed: boolean
  }
  product: {
    name: string
    price: number
    plan: 'starter' | 'pro' | 'team'
  }
  session: {
    visits: number
    lastSurface: PrimitiveName
  }
}

export type SemanticEvent = {
  id: string
  type: 'activate' | 'submit' | 'change'
  at: number
  target: SemanticTarget
  nearbyText: string
  world: WorldState
  affordances: PrimitiveName[]
}

export type UIAction =
  | {
      type: 'present'
      component: PrimitiveName
      reason: string
    }
  | {
      type: 'update-world'
      path: 'user.loggedIn' | 'user.hasPaymentMethod' | 'user.trialUsed'
      value: boolean
      reason: string
    }
  | {
      type: 'noop'
      reason: string
    }

export type Candidate = {
  component: PrimitiveName
  probability: number
}

export type PolicyDecision = {
  action: UIAction
  confidence: number
  candidates: Candidate[]
  rationale: string
  model: string
  latencyMs: number
}

export type SemanticPolicy = {
  decide(event: SemanticEvent): Promise<PolicyDecision>
}

export type TransitionLog = {
  event: SemanticEvent
  decision: PolicyDecision
}
