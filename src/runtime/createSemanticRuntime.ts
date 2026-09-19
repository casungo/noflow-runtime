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
  confidenceThreshold?: number
  confirmationThreshold?: number
  fallbackSurface?: Surface
  confirm?: (event: SemanticEvent<Surface, World>, decision: PolicyDecision<Surface>) => boolean | Promise<boolean>
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
    if (options.fallbackSurface !== undefined && !options.affordances.includes(options.fallbackSurface)) {
      throw new Error(`Fallback surface is not a registered affordance: ${options.fallbackSurface}`)
    }
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

  setGuardrails(
    options: Pick<RuntimeOptions<Surface, World>, 'confidenceThreshold' | 'confirmationThreshold' | 'fallbackSurface'>,
  ) {
    if (options.fallbackSurface !== undefined && !this.options.affordances.includes(options.fallbackSurface)) {
      throw new Error(`Fallback surface is not a registered affordance: ${options.fallbackSurface}`)
    }
    Object.assign(this.options, options)
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
      let decision: PolicyDecision<Surface>
      let usedErrorFallback = false
      try {
        decision = await this.policy.decide(event)
      } catch (error) {
        if (this.options.fallbackSurface === undefined) throw error
        usedErrorFallback = true
        decision = {
          action: {
            type: 'present',
            component: this.options.fallbackSurface,
            reason: 'The semantic policy was unavailable, so the runtime used its registered fallback.',
          },
          confidence: 0,
          candidates: [],
          rationale: error instanceof Error ? error.message : 'The semantic policy was unavailable.',
          model: 'deterministic-fallback',
          latencyMs: 0,
          safety: { ambiguity: 1, requiresConfirmation: 0 },
          resolution: 'error-fallback',
        }
      }

      if (
        decision.action.type === 'present' &&
        !this.options.affordances.includes(decision.action.component)
      ) {
        throw new Error(`Semantic policy returned an unregistered affordance: ${decision.action.component}`)
      }

      if (
        !usedErrorFallback &&
        this.options.confidenceThreshold !== undefined &&
        decision.confidence < this.options.confidenceThreshold
      ) {
        const fallbackAction: PolicyDecision<Surface>['action'] = this.options.fallbackSurface
          ? {
              type: 'present',
              component: this.options.fallbackSurface,
              reason: 'Confidence was below the runtime threshold.',
            }
          : { type: 'noop', reason: 'Confidence was below the runtime threshold.' }
        decision = {
          ...decision,
          action: fallbackAction,
          policyAction: decision.action,
          resolution: 'confidence-fallback',
        }
      } else if (
        !usedErrorFallback &&
        decision.action.type === 'present' &&
        (decision.safety?.requiresConfirmation ?? 0) >= (this.options.confirmationThreshold ?? 1)
      ) {
        const accepted = (await this.options.confirm?.(event, decision)) ?? false
        if (accepted) {
          decision = { ...decision, resolution: 'confirmed' }
        } else {
          decision = {
            ...decision,
            action: { type: 'noop', reason: 'The user declined confirmation for this action.' },
            policyAction: decision.action,
            resolution: 'confirmation-declined',
          }
        }
      } else if (!decision.resolution) {
        decision = { ...decision, resolution: 'policy' }
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
