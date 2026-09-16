import type {
  PolicyDecision,
  PrimitiveName,
  SemanticEvent,
  SemanticPolicy,
  SemanticTarget,
  TransitionLog,
  WorldState,
} from './types'

export type RuntimeSnapshot = {
  surface: PrimitiveName
  world: WorldState
  pending: boolean
  lastDecision: PolicyDecision | null
  history: TransitionLog[]
}

type Listener = (snapshot: RuntimeSnapshot) => void

const affordances: PrimitiveName[] = [
  'checkout',
  'comparison',
  'trial',
  'support',
  'login',
  'dashboard',
  'details',
  'welcome',
]

export class SemanticRuntime {
  private listeners = new Set<Listener>()
  private snapshot: RuntimeSnapshot

  constructor(
    private readonly policy: SemanticPolicy,
    initialWorld: WorldState,
  ) {
    this.snapshot = {
      surface: 'welcome',
      world: initialWorld,
      pending: false,
      lastDecision: null,
      history: [],
    }
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(next: RuntimeSnapshot) {
    this.snapshot = next
    for (const listener of this.listeners) listener(this.snapshot)
  }

  setWorld(world: WorldState) {
    this.emit({ ...this.snapshot, world })
  }

  reset() {
    this.emit({
      ...this.snapshot,
      surface: 'welcome',
      pending: false,
      lastDecision: null,
      history: [],
      world: {
        ...this.snapshot.world,
        session: { ...this.snapshot.world.session, lastSurface: 'welcome' },
      },
    })
  }

  async dispatch(
    target: SemanticTarget,
    nearbyText: string,
  ): Promise<PolicyDecision> {
    const event: SemanticEvent = {
      id: crypto.randomUUID(),
      type: 'activate',
      at: Date.now(),
      target,
      nearbyText,
      world: this.snapshot.world,
      affordances,
    }

    this.emit({ ...this.snapshot, pending: true })

    try {
      const decision = await this.policy.decide(event)
      const nextSurface =
        decision.action.type === 'present' ? decision.action.component : this.snapshot.surface

      const nextWorld: WorldState = {
        ...this.snapshot.world,
        session: {
          ...this.snapshot.world.session,
          lastSurface: nextSurface,
          visits: this.snapshot.world.session.visits + 1,
        },
      }

      this.emit({
        ...this.snapshot,
        surface: nextSurface,
        world: nextWorld,
        pending: false,
        lastDecision: decision,
        history: [{ event, decision }, ...this.snapshot.history].slice(0, 8),
      })

      return decision
    } catch (error) {
      this.emit({ ...this.snapshot, pending: false })
      throw error
    }
  }
}
