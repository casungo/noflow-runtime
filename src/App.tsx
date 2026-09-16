import { useMemo, useState } from 'react'
import { SemanticButton } from './components/SemanticButton'
import { Surface } from './components/Surface'
import { SemanticRuntime } from './runtime/createSemanticRuntime'
import { MockSemanticPolicy } from './runtime/mockPolicy'
import { HttpSemanticPolicy } from './runtime/httpPolicy'
import type { PrimitiveName } from './runtime/types'
import { useSemanticRuntime } from './runtime/useSemanticRuntime'
import type { DemoWorldState } from './demoTypes'

const initialWorld: DemoWorldState = {
  user: {
    loggedIn: true,
    hasPaymentMethod: false,
    trialUsed: false,
  },
  product: {
    name: 'Reflow Cloud',
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

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export default function App() {
  const runtime = useMemo(() => {
    const policy =
      import.meta.env.VITE_POLICY_MODE === 'jev'
        ? new HttpSemanticPolicy<PrimitiveName, DemoWorldState>(
            import.meta.env.VITE_SEMANTIC_POLICY_URL ?? '/api/semantic-transition',
          )
        : new MockSemanticPolicy<DemoWorldState>()

    return new SemanticRuntime<PrimitiveName, DemoWorldState>(policy, initialWorld, {
      affordances: ['checkout', 'comparison', 'trial', 'support', 'login', 'dashboard', 'details', 'welcome'],
      initialSurface: 'welcome',
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
            <strong>Reflow</strong>
            <span>semantic runtime</span>
          </div>
        </div>
        <div className="header-line">
          <span className="status-dot" />
          {import.meta.env.VITE_POLICY_MODE === 'jev' ? 'jev policy online' : 'local policy online'}
        </div>
        <a className="github-pill" href="https://github.com" target="_blank" rel="noreferrer">
          v0.1 concept
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="kicker">INTERFACES WITHOUT FLOWCHARTS</span>
            <h1>
              Buttons don’t have handlers.
              <br />
              <em>They have meaning.</em>
            </h1>
            <p>
              Every interaction becomes a semantic event. A fast policy chooses the next UI mutation from
              the affordances your app exposes.
            </p>
          </div>
          <div className="hero__formula" aria-label="Reflow formula">
            <span>event</span>
            <i>→</i>
            <span>meaning</span>
            <i>→</i>
            <span>policy</span>
            <i>→</i>
            <span>UI</span>
          </div>
        </section>

        <section className="workbench">
          <div className="panel canvas-panel">
            <div className="panel__header">
              <div>
                <span className="panel__index">01</span>
                <h2>Prototype canvas</h2>
              </div>
              <button className="text-button" onClick={() => runtime.reset()}>
                reset
              </button>
            </div>

            <div className="editor-grid">
              <label className="field field--wide">
                <span>Change only the button copy</span>
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
                    <small>No handler is attached to this CTA.</small>
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
                  <span>resolving meaning…</span>
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
              <span className="live-badge">LIVE</span>
            </div>

            <div className="inspector-block">
              <div className="inspector-label"><span>semantic target</span><span>input</span></div>
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
            </div>

            <div className="decision-card">
              <div className="inspector-label"><span>last decision</span><span>output</span></div>
              {snapshot.lastDecision ? (
                <>
                  <div className="decision-main">
                    <div>
                      <span>present</span>
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
                <div className="empty-state">Click the CTA. The runtime will choose a transition.</div>
              )}
            </div>
          </aside>
        </section>

        <section className="principles">
          <article>
            <span>01</span>
            <h3>No flow graph</h3>
            <p>You register what the app can do, not every path a user can take.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Meaning is the API</h3>
            <p>Copy, surrounding content, position and world-state form the interaction contract.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Fast policy loop</h3>
            <p>Swap the mock policy for Jev behind one endpoint and preserve the frontend runtime.</p>
          </article>
        </section>

        <section className="code-strip">
          <div>
            <span className="kicker">THE WHOLE IDEA</span>
            <h2>Change the sentence.<br />Change the product behavior.</h2>
          </div>
          <pre><code>{`<SemanticButton id="hero-cta">\n  {label}\n</SemanticButton>\n\n// no onClick={() => goTo('/checkout')}`}</code></pre>
        </section>
      </main>

      <footer>
        <strong>Reflow / runtime</strong>
        <span>Built to make “idea → prototype” feel instantaneous.</span>
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
