import { useMemo, useRef, useState } from 'react'
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

const confidenceThreshold = 0.65
const confirmationThreshold = 0.7
const fallbackSurface: PrimitiveName = 'welcome'

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export default function App() {
  const [simulateFailure, setSimulateFailure] = useState(false)
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
      affordances: ['checkout', 'comparison', 'trial', 'support', 'login', 'dashboard', 'details', 'welcome'],
      initialSurface: 'welcome',
      confidenceThreshold,
      confirmationThreshold,
      fallbackSurface,
      confirm: (event, decision) =>
        window.confirm(
          `Confirm semantic action?\n\n"${event.target.label}" → ${
            decision.action.type === 'present' ? decision.action.component : decision.action.type
          }`,
        ),
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
    id: 'hero-cta',
    role: 'button',
    label,
    position,
    description: 'Primary product CTA. No destination or action is encoded here.',
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <div className="brand__mark">N</div>
          <div>
            <strong>NoFlow</strong>
            <span>buttons with opinions</span>
          </div>
        </div>
        <div className="header-line">
          <span className="status-dot" />
          {import.meta.env.VITE_POLICY_MODE === 'jev' ? 'jev policy online' : 'local policy online'}
        </div>
        <a className="github-pill" href="https://github.com/casungo/noflow-runtime" target="_blank" rel="noreferrer">
          GitHub / 0.1
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="kicker">BUTTONS WITH OPINIONS</span>
            <h1>
              Tired of knowing exactly what your button does?
              <br />
              <em>Let it have a little say.</em>
            </h1>
            <p>
              NoFlow turns a click into meaning, asks a policy to pick from the things your app actually knows
              how to show, and then tries not to embarrass itself. Maybe someone builds something crazy with it.
            </p>
          </div>
          <div className="hero__formula" aria-label="NoFlow formula">
            <span>click</span>
            <i>→</i>
            <span>vibes</span>
            <i>→</i>
            <span>guardrails</span>
            <i>→</i>
            <span>UI</span>
          </div>
        </section>

        <section className="workbench">
          <div className="panel canvas-panel">
            <div className="panel__header">
              <div>
                <span className="panel__index">01</span>
                <h2>Tiny chaos lab</h2>
              </div>
              <button className="text-button" onClick={() => runtime.reset()}>
                reset
              </button>
            </div>

            <div className="editor-grid">
              <label className="field field--wide">
                <span>Change the words. See what it thinks.</span>
                <input value={label} onChange={(event) => setLabel(event.target.value)} />
              </label>
              <label className="field">
                <span>How important is it?</span>
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
                <span className="prototype-frame__mode">semantic</span>
              </div>

              <div className="product-shell">
                <div className="product-nav">
                  <strong>ACME°</strong>
                  <div><span>Product</span><span>Pricing</span><span>Docs</span></div>
                </div>

                <Surface name={snapshot.surface} world={snapshot.world} />

                <div className={`cta-stage cta-stage--${position}`} data-semantic-context>
                  <div className="cta-copy">
                    <span>€{snapshot.world.product.price}/month · cancel anytime</span>
                    <small>No handler. The button is free-range.</small>
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
                  <span>asking the button what it meant...</span>
                </div>
              )}
            </div>
          </div>

          <aside className="panel inspector-panel">
            <div className="panel__header">
              <div>
                <span className="panel__index">02</span>
                <h2>What did it think?</h2>
              </div>
              <span className="live-badge">LIVE</span>
            </div>

            <div className="inspector-block">
              <div className="inspector-label"><span>button evidence</span><span>input</span></div>
              <pre>{formatJson(targetPreview)}</pre>
            </div>

            <div className="world-controls">
              <div className="inspector-label"><span>world state, allegedly</span><span>editable</span></div>
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
              <div className="inspector-label"><span>guardrails for the vibes</span><span>debug</span></div>
              <div className="debug-row"><span>confidence minimum</span><strong>{confidenceThreshold * 100}%</strong></div>
              <div className="debug-row"><span>confirmation minimum</span><strong>{confirmationThreshold * 100}%</strong></div>
              <div className="debug-row"><span>fallback surface</span><strong>{fallbackSurface}</strong></div>
            </div>

            <div className="decision-card">
              <div className="inspector-label"><span>latest guess</span><span>output</span></div>
              {snapshot.lastDecision ? (
                <>
                  <div className="decision-main">
                    <div>
                      <span>applied action</span>
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
                <div className="empty-state">Click it. See what it thinks. It can only choose registered stuff.</div>
              )}
            </div>
          </aside>
        </section>

        <section className="principles">
          <article>
            <span>01</span>
            <h3>Fewer arrows</h3>
            <p>Register what the app can do. Stop drawing every possible route.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Words do some work</h3>
            <p>Copy, context, position, and world state give the button something to go on.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Fast enough to be weird</h3>
            <p>Swap the local guess for Jev behind one endpoint. Keep the same runtime.</p>
          </article>
        </section>

        <section className="code-strip">
          <div>
            <span className="kicker">THE ENTIRE BET</span>
            <h2>Change the words.<br />Watch the UI pick a side.</h2>
          </div>
          <pre><code>{`<SemanticButton id="hero-cta">\n  {label}\n</SemanticButton>\n\n// no onClick. trust the affordances.`}</code></pre>
        </section>
      </main>

      <footer>
        <strong>NoFlow / runtime</strong>
        <span>For ideas that are brilliant, cursed, or both.</span>
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
