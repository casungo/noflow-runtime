import type {
  PolicyDecision,
  SemanticEvent,
  SemanticPolicy,
  SemanticTarget,
  TransitionLog,
  WorldState,
} from './types'

export type RuntimeOptions<Surface extends string = string, World extends WorldState = WorldState> = {
  affordances: readonly Surface[]
  initialSurface: Surface
  historyLimit?: number
  reduceWorld?: (world: World, decision: PolicyDecision<Surface>) => World
}

export type RuntimeSnapshot<Surface extends string = string, World extends WorldState = WorldState> = {
  surface: Surface
  world: World
  pending: boolean
  lastDecision: PolicyDecision<Surface> | null
  history: TransitionLog<Surface, World>[]
}

type Listener<Surface extends string, World extends WorldState> = (
  snapshot: RuntimeSnapshot<Surface, World>,
) => void

export class SemanticRuntime<Surface extends string = string, World extends WorldState = WorldState> {
  private listeners = new Set<Listener<Surface, World>>()
  private readonly initialWorld: World
  private readonly options: RuntimeOptions<Surface, World>
  private readonly historyLimit: number
  private snapshot: RuntimeSnapshot<Surface, World>

  constructor(
    private readonly policy: SemanticPolicy<Surface, World>,
    initialWorld: World,
    options: RuntimeOptions<Surface, World>,
  ) {
    this.initialWorld = initialWorld
    this.options = options
    this.historyLimit = Math.max(0, Math.floor(options.historyLimit ?? 50))
    this.snapshot = {
      surface: options.initialSurface,
      world: initialWorld,
      pending: false,
      lastDecision: null,
      history: [],
    }
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener: Listener<Surface, World>) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(next: RuntimeSnapshot<Surface, World>) {
    this.snapshot = next
    for (const listener of this.listeners) listener(this.snapshot)
  }

  setWorld(world: World) {
    this.emit({ ...this.snapshot, world })
  }

  reset() {
    this.emit({
      surface: this.options.initialSurface,
      world: this.initialWorld,
      pending: false,
      lastDecision: null,
      history: [],
    })
  }

  async dispatch(
    target: SemanticTarget,
    nearbyText: string,
  ): Promise<PolicyDecision<Surface>> {
    const event: SemanticEvent<Surface, World> = {
      id: crypto.randomUUID(),
      type: 'activate',
      at: Date.now(),
      target,
      nearbyText,
      world: this.snapshot.world,
      affordances: [...this.options.affordances],
    }

    this.emit({ ...this.snapshot, pending: true })

    try {
      const decision = await this.policy.decide(event)
      if (
        decision.action.type === 'present' &&
        !this.options.affordances.includes(decision.action.component)
      ) {
        throw new Error(`Semantic policy returned an unregistered affordance: ${decision.action.component}`)
      }

      const nextSurface = decision.action.type === 'present' ? decision.action.component : this.snapshot.surface

      const nextWorld = this.options.reduceWorld?.(this.snapshot.world, decision) ?? this.snapshot.world

      this.emit({
        ...this.snapshot,
        surface: nextSurface,
        world: nextWorld,
        pending: false,
        lastDecision: decision,
        history: [{ event, decision }, ...this.snapshot.history].slice(0, this.historyLimit),
      })

      return decision
    } catch (error) {
      this.emit({ ...this.snapshot, pending: false })
      throw error
    }
  }
}
