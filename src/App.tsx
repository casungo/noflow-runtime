import { useEffect, useMemo, useRef, useState } from 'react'
import { SemanticButton } from './components/SemanticButton'
import { Surface } from './components/Surface'
import { SemanticRuntime } from './runtime/createSemanticRuntime'
import { MockSemanticPolicy } from './runtime/mockPolicy'
import { HttpSemanticPolicy } from './runtime/httpPolicy'
import type { PrimitiveName, SemanticEvent } from './runtime/types'
import { useSemanticRuntime } from './runtime/useSemanticRuntime'
import type { DemoWorldState } from './demoTypes'

const initialWorld: DemoWorldState = {
  user: {
    loggedIn: true,
    hasPaymentMethod: false,
    trialUsed: false,
  },
  product: {
    name: 'NoFlow Cloud',
    price: 29,
    plan: 'pro',
  },
  session: {
    visits: 0,
    lastSurface: 'welcome',
  },
}

const suggestions = [
  'Buy Pro',
  'Compare plans',
  'Try it free',
  'I need help',
  'Show me more',
  'Continue',
]

const semanticActions = [
  {
    id: 'compare-action',
    label: 'Compare plans',
    title: 'Still deciding?',
    description: 'Lay out the differences before you commit.',
    position: 'secondary' as const,
    descriptionForPolicy: 'Secondary plan comparison action for a user still evaluating options.',
  },
  {
    id: 'trial-action',
    label: 'Start free trial',
    title: 'Try it on your own',
    description: 'Explore the workspace before paying for it.',
    position: 'secondary' as const,
    descriptionForPolicy: 'Low-commitment product exploration action for a new or undecided user.',
  },
  {
    id: 'support-action',
    label: 'Talk to a human',
    title: 'Have a question?',
    description: 'Send the problem to someone who can answer it.',
    position: 'footer' as const,
    descriptionForPolicy: 'Footer support action for a user who needs human help.',
  },
]

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
const defaultConfidenceThreshold = 0.65
const defaultConfirmationThreshold = 0.7
const defaultFallbackSurface: PrimitiveName = 'welcome'

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export default function App() {
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [confidenceThreshold, setConfidenceThreshold] = useState(defaultConfidenceThreshold)
  const [confirmationThreshold, setConfirmationThreshold] = useState(defaultConfirmationThreshold)
  const [fallbackSurface, setFallbackSurface] = useState<PrimitiveName>(defaultFallbackSurface)
  const [showSafetyWarning, setShowSafetyWarning] = useState(false)
  const simulateFailureRef = useRef(simulateFailure)
  simulateFailureRef.current = simulateFailure

  const runtime = useMemo(() => {
    const selectedPolicy =
      import.meta.env.VITE_POLICY_MODE === 'jev'
        ? new HttpSemanticPolicy<PrimitiveName, DemoWorldState>(
            import.meta.env.VITE_SEMANTIC_POLICY_URL ?? '/api/semantic-transition',
          )
        : new MockSemanticPolicy<DemoWorldState>()
    const policy = {
      decide(event: SemanticEvent<PrimitiveName, DemoWorldState>) {
        if (simulateFailureRef.current) throw new Error('debug policy outage')
        return selectedPolicy.decide(event)
      },
    }

    return new SemanticRuntime<PrimitiveName, DemoWorldState>(policy, initialWorld, {
      affordances,
      initialSurface: 'welcome',
      confidenceThreshold: defaultConfidenceThreshold,
      confirmationThreshold: defaultConfirmationThreshold,
      fallbackSurface: defaultFallbackSurface,
      confirm: () => true,
      reduceWorld: (world, decision) => ({
        ...world,
        session: {
          ...world.session,
          lastSurface: decision.action.type === 'present' ? decision.action.component : world.session.lastSurface,
          visits: world.session.visits + 1,
        },
      }),
    })
  }, [])
  const snapshot = useSemanticRuntime(runtime)
  const [label, setLabel] = useState('Buy Pro')
  const [position, setPosition] = useState<'primary' | 'secondary' | 'footer'>('primary')

  useEffect(() => {
    runtime.setGuardrails({ confidenceThreshold, confirmationThreshold, fallbackSurface })
  }, [runtime, confidenceThreshold, confirmationThreshold, fallbackSurface])

  const updateUser = (key: keyof DemoWorldState['user'], value: boolean) => {
    runtime.setWorld({
      ...snapshot.world,
      user: {
        ...snapshot.world.user,
        [key]: value,
      },
    })
  }

  const targetPreview = {
    ...(snapshot.history[0]?.event.target ?? {
      id: 'hero-cta',
      role: 'button' as const,
      label,
      position,
      description: 'Primary product CTA. No destination or action is encoded here.',
    }),
    nearbyText: snapshot.history[0]?.event.nearbyText ?? 'No click yet. The editable CTA is the next event.',
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <div className="brand__mark">N</div>
          <div>
            <strong>NoFlow</strong>
            <span>semantic UI runtime</span>
          </div>
        </div>
        <div className="header-line">
          <span className="status-dot" />
          {import.meta.env.VITE_POLICY_MODE === 'jev' ? 'jev policy online' : 'local policy online'}
        </div>
        <a className="github-pill" href="https://github.com/casungo/noflow-runtime" target="_blank" rel="noreferrer">
          GitHub / runtime
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="kicker">SEMANTIC UI RUNTIME</span>
            <h1>
              Let the interface describe intent.
              <br />
              <em>Keep the next step within your app.</em>
            </h1>
            <p>
              NoFlow sends a click, its surrounding context, and current app state to a policy. The policy chooses
              one registered surface. The runtime checks the result before changing the UI.
            </p>
          </div>
          <div className="hero__formula" aria-label="NoFlow formula">
            <span>event</span>
            <i>→</i>
            <span>policy</span>
            <i>→</i>
            <span>checks</span>
            <i>→</i>
            <span>surface</span>
          </div>
        </section>

        <section className="workbench">
          <div className="panel canvas-panel">
            <div className="panel__header">
              <div>
                <span className="panel__index">01</span>
                <h2>Decision playground</h2>
              </div>
              <button className="text-button" onClick={() => runtime.reset()}>
                Reset
              </button>
            </div>

            <div className="editor-grid">
              <label className="field field--wide">
                <span>Change the label sent to the policy.</span>
                <input value={label} onChange={(event) => setLabel(event.target.value)} />
              </label>
              <label className="field">
                <span>Semantic position</span>
                <select value={position} onChange={(event) => setPosition(event.target.value as typeof position)}>
                  <option value="primary">primary</option>
                  <option value="secondary">secondary</option>
                  <option value="footer">footer</option>
                </select>
              </label>
            </div>

            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} onClick={() => setLabel(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="prototype-frame">
              <div className="prototype-frame__bar">
                <div className="traffic"><i /><i /><i /></div>
                  <span>acme.local/pricing</span>
                  <span className="prototype-frame__mode">Runtime</span>
              </div>

              <div className="product-shell">
                <div className="product-nav">
                  <strong>ACME°</strong>
                  <div><span>Product</span><span>Pricing</span><span>Docs</span></div>
                </div>

                <Surface name={snapshot.surface} world={snapshot.world} />

                <section className="action-deck" data-semantic-context>
                  <div className="action-deck__header">
                    <div>
                      <span className="eyebrow">Several semantic controls</span>
                      <h3>Test several intents on one page.</h3>
                    </div>
                    <span className="action-deck__hint">one runtime, different context</span>
                  </div>
                  <div className="action-grid">
                    {semanticActions.map((action) => (
                      <article className="action-card" key={action.id}>
                        <span className="action-card__kind">{action.position} action</span>
                        <strong>{action.title}</strong>
                        <p>{action.description}</p>
                        <SemanticButton
                          id={action.id}
                          runtime={runtime}
                          description={action.descriptionForPolicy}
                          position={action.position}
                          className="semantic-action"
                        >
                          {action.label}
                        </SemanticButton>
                      </article>
                    ))}
                  </div>
                </section>

                <div className={`cta-stage cta-stage--${position}`} data-semantic-context>
                  <div className="cta-copy">
                      <span>€{snapshot.world.product.price} / month, cancel anytime</span>
                    <small>This control reports intent. The runtime chooses the surface.</small>
                  </div>
                  <SemanticButton
                    id="hero-cta"
                    runtime={runtime}
                    description="Primary product CTA. No destination or action is encoded here."
                    position={position}
                    className="semantic-cta"
                  >
                    {label}
                  </SemanticButton>
                </div>
              </div>

              {snapshot.pending && (
                <div className="thinking-overlay">
                  <div className="pulse-ring" />
                  <span>Evaluating the event...</span>
                </div>
              )}
            </div>
          </div>

          <aside className="panel inspector-panel">
            <div className="panel__header">
              <div>
                <span className="panel__index">02</span>
                <h2>Decision inspector</h2>
              </div>
              <span className="live-badge">Running</span>
            </div>

            <div className="inspector-block">
              <div className="inspector-label"><span>event input</span><span>input</span></div>
              <pre>{formatJson(targetPreview)}</pre>
            </div>

            <div className="world-controls">
                <div className="inspector-label"><span>world state</span><span>editable</span></div>
              <Toggle
                label="logged in"
                checked={snapshot.world.user.loggedIn}
                onChange={(value) => updateUser('loggedIn', value)}
              />
              <Toggle
                label="payment saved"
                checked={snapshot.world.user.hasPaymentMethod}
                onChange={(value) => updateUser('hasPaymentMethod', value)}
              />
              <Toggle
                label="trial already used"
                checked={snapshot.world.user.trialUsed}
                onChange={(value) => updateUser('trialUsed', value)}
              />
              <Toggle
                label="simulate policy outage"
                checked={simulateFailure}
                onChange={setSimulateFailure}
              />
            </div>

            <div className="debug-block">
              <div className="inspector-label"><span>runtime guardrails</span><span>debug</span></div>
              <label className="guardrail-control" htmlFor="confidence-threshold">
                <span><span>confidence minimum</span><strong>{Math.round(confidenceThreshold * 100)}%</strong></span>
                <input
                  id="confidence-threshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
                />
              </label>
              <label className="guardrail-control" htmlFor="confirmation-threshold">
                <span><span>confirmation minimum</span><strong>{Math.round(confirmationThreshold * 100)}%</strong></span>
                <input
                  id="confirmation-threshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={confirmationThreshold}
                  onChange={(event) => setConfirmationThreshold(Number(event.target.value))}
                />
              </label>
              <label className="guardrail-select" htmlFor="fallback-surface">
                <span>fallback surface</span>
                <select
                  id="fallback-surface"
                  value={fallbackSurface}
                  onChange={(event) => setFallbackSurface(event.target.value)}
                >
                  {affordances.map((surface) => <option key={surface}>{surface}</option>)}
                </select>
              </label>
              <Toggle
                label="show confirmation warning"
                checked={showSafetyWarning}
                onChange={setShowSafetyWarning}
              />
              <p className="guardrail-hint">Enable this to show the guardrail message in the decision panel.</p>
            </div>

            <div className="decision-card">
              <div className="inspector-label"><span>latest decision</span><span>output</span></div>
              {snapshot.lastDecision ? (
                <>
                  {showSafetyWarning && snapshot.lastDecision.resolution === 'confirmed' && (
                    <div className="safety-notice" role="status">
                      <strong>Confirmation would be required.</strong>
                      <span>
                        The policy estimated {Math.round((snapshot.lastDecision.safety?.requiresConfirmation ?? 0) * 100)}%,
                        above the {Math.round(confirmationThreshold * 100)}% threshold.
                      </span>
                    </div>
                  )}
                  {showSafetyWarning && snapshot.lastDecision.resolution === 'confidence-fallback' && (
                    <div className="safety-notice" role="status">
                      <strong>Confidence below threshold.</strong>
                      <span>
                        The runtime used {fallbackSurface} because the policy returned {Math.round(snapshot.lastDecision.confidence * 100)}%,
                        below the {Math.round(confidenceThreshold * 100)}% threshold.
                      </span>
                    </div>
                  )}
                  <div className="decision-main">
                    <div>
                      <span>applied surface</span>
                      <strong>
                        {snapshot.lastDecision.action.type === 'present'
                          ? snapshot.lastDecision.action.component
                          : snapshot.lastDecision.action.type}
                      </strong>
                    </div>
                    <div className="confidence-ring">
                      {Math.round(snapshot.lastDecision.confidence * 100)}%
                    </div>
                  </div>
                  <div className="latency-line">
                    <span>{snapshot.lastDecision.model}</span>
                    <strong>{snapshot.lastDecision.latencyMs} ms</strong>
                  </div>
                  <div className="debug-status">
                    <div className="debug-row">
                      <span>resolution</span>
                      <strong>{snapshot.lastDecision.resolution ?? 'policy'}</strong>
                    </div>
                    <div className="debug-row">
                      <span>ambiguity</span>
                      <strong>{Math.round((snapshot.lastDecision.safety?.ambiguity ?? 0) * 100)}%</strong>
                    </div>
                    <div className="debug-row">
                      <span>needs confirmation</span>
                      <strong>{Math.round((snapshot.lastDecision.safety?.requiresConfirmation ?? 0) * 100)}%</strong>
                    </div>
                    {snapshot.lastDecision.policyAction && (
                      <div className="debug-row">
                        <span>policy action</span>
                        <strong>
                          {snapshot.lastDecision.policyAction.type === 'present'
                            ? snapshot.lastDecision.policyAction.component
                            : snapshot.lastDecision.policyAction.type}
                        </strong>
                      </div>
                    )}
                  </div>
                  <div className="candidate-list">
                    {snapshot.lastDecision.candidates.map((candidate) => (
                      <div key={candidate.component}>
                        <span>{candidate.component}</span>
                        <div className="bar"><i style={{ width: `${candidate.probability * 100}%` }} /></div>
                        <strong>{Math.round(candidate.probability * 100)}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">Activate a control to inspect its event and decision.</div>
              )}
            </div>
          </aside>
        </section>

        <section className="principles">
          <article>
            <span>01</span>
            <h3>Register safe outcomes</h3>
            <p>The policy can choose only the surfaces your app exposes.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Context carries intent</h3>
            <p>Labels, placement, nearby text, and world state travel with each event.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Keep policy replaceable</h3>
            <p>Use the local policy in development and Jev behind your server endpoint.</p>
          </article>
        </section>

        <section className="code-strip">
          <div>
            <span className="kicker">The small contract</span>
            <h2>One event in.<br />One registered surface out.</h2>
          </div>
          <pre><code>{`<SemanticButton id="hero-cta">\n  {label}\n</SemanticButton>\n\n// the runtime validates the surface`}</code></pre>
        </section>
      </main>

      <footer>
        <strong>NoFlow / runtime</strong>
        <span>A small runtime for intent-driven UI.</span>
      </footer>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  )
}
