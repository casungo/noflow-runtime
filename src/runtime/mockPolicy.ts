import type {
  Candidate,
  PolicyDecision,
  PrimitiveName,
  SemanticEvent,
  SemanticPolicy,
  WorldState,
} from './types'

type MockWorldState = WorldState & {
  user: {
    loggedIn: boolean
    hasPaymentMethod: boolean
    trialUsed: boolean
  }
}

const primitives: PrimitiveName[] = [
  'checkout',
  'comparison',
  'trial',
  'support',
  'login',
  'dashboard',
  'details',
  'welcome',
]

type Signal = { pattern: RegExp; component: PrimitiveName; weight: number }

const signals: Signal[] = [
  { pattern: /buy|purchase|pay|checkout|subscribe|get pro|upgrade/i, component: 'checkout', weight: 0.92 },
  { pattern: /compare|difference|plans|options|which plan/i, component: 'comparison', weight: 0.94 },
  { pattern: /try|trial|start free|free/i, component: 'trial', weight: 0.9 },
  { pattern: /help|support|talk|question|human/i, component: 'support', weight: 0.95 },
  { pattern: /login|sign in|account/i, component: 'login', weight: 0.95 },
  { pattern: /dashboard|continue|open app|workspace/i, component: 'dashboard', weight: 0.88 },
  { pattern: /details|learn|more|explain|how/i, component: 'details', weight: 0.86 },
]

function clamp(value: number, min = 0, max = 0.99) {
  return Math.min(max, Math.max(min, value))
}

function makeCandidates(event: SemanticEvent): Candidate[] {
  const text = `${event.target.label} ${event.target.description ?? ''} ${event.nearbyText}`
  const world = event.world as MockWorldState
  const scores = new Map<PrimitiveName, number>(primitives.map((name) => [name, 0.05]))

  for (const signal of signals) {
    if (signal.pattern.test(text)) {
      scores.set(signal.component, Math.max(scores.get(signal.component) ?? 0, signal.weight))
    }
  }

  if (!world.user.loggedIn) {
    scores.set('login', clamp((scores.get('login') ?? 0) + 0.12))
  }

  if (world.user.loggedIn && /continue|next|go/i.test(text)) {
    scores.set('dashboard', 0.72)
  }

  if (world.user.trialUsed && /trial|free|try/i.test(text)) {
    scores.set('checkout', 0.81)
    scores.set('trial', 0.32)
  }

  if (world.user.hasPaymentMethod && /buy|upgrade|purchase|checkout/i.test(text)) {
    scores.set('checkout', 0.97)
  }

  // Position is meaning too. Primary affordances lean toward commitment;
  // secondary/footer affordances lean toward exploration and support.
  if (event.target.position === 'primary') {
    scores.set('checkout', clamp((scores.get('checkout') ?? 0) + 0.035))
    scores.set('trial', clamp((scores.get('trial') ?? 0) + 0.025))
  } else if (event.target.position === 'secondary') {
    scores.set('comparison', clamp((scores.get('comparison') ?? 0) + 0.04))
    scores.set('details', clamp((scores.get('details') ?? 0) + 0.04))
  } else if (event.target.position === 'footer') {
    scores.set('support', clamp((scores.get('support') ?? 0) + 0.04))
    scores.set('details', clamp((scores.get('details') ?? 0) + 0.03))
  }

  const ranked = [...scores.entries()]
    .map(([component, probability]) => ({ component, probability }))
    .sort((a, b) => b.probability - a.probability)

  const [best] = ranked
  if (best.probability <= 0.08) {
    return ranked.map((candidate, index) =>
      index === 0 ? { component: 'details', probability: 0.54 } : candidate,
    )
  }

  return ranked
}

export class MockSemanticPolicy<World extends MockWorldState = MockWorldState>
  implements SemanticPolicy<PrimitiveName, World>
{
  async decide(event: SemanticEvent<PrimitiveName, World>): Promise<PolicyDecision<PrimitiveName>> {
    const started = performance.now()
    const candidates = makeCandidates(event)
    const delay = 72 + Math.floor(Math.random() * 54)
    await new Promise((resolve) => setTimeout(resolve, delay))

    const best = candidates[0]
    const latencyMs = Math.round(performance.now() - started)

    return {
      action: {
        type: 'present',
        component: best.component,
        reason: `The semantic signal in “${event.target.label}” most strongly implies ${best.component}.`,
      },
      confidence: best.probability,
      candidates: candidates.slice(0, 4),
      rationale:
        'This local policy is only a runnable stand-in. Replace it with Jev and keep the exact same event/action contract.',
      model: 'local-semantic-mock',
      latencyMs,
      safety: {
        ambiguity: clamp(1 - best.probability),
        requiresConfirmation: best.component === 'checkout' ? 0.8 : 0.02,
      },
      resolution: 'policy',
    }
  }
}
