import type { PrimitiveName } from '../runtime/types'
import type { DemoWorldState } from '../demoTypes'

type SurfaceProps = {
  name: PrimitiveName
  world: DemoWorldState
}

const copy: Record<PrimitiveName, { eyebrow: string; title: string; body: string }> = {
  welcome: {
    eyebrow: 'Registered surfaces',
    title: 'Your app decides what can appear next.',
    body: 'NoFlow sends a semantic event to a policy, then applies only a registered surface that passes the runtime checks.',
  },
  checkout: {
    eyebrow: 'Purchase flow',
    title: 'Checkout is ready.',
    body: 'The event looked like a purchase, and the runtime selected the registered checkout surface.',
  },
  comparison: {
    eyebrow: 'Plan comparison',
    title: 'Compare the plans.',
    body: 'The event carried evaluation intent, so the runtime selected the comparison surface.',
  },
  trial: {
    eyebrow: 'Trial flow',
    title: 'Start with a trial.',
    body: 'The event suggested low-commitment exploration, so the runtime selected the trial surface.',
  },
  support: {
    eyebrow: 'Support flow',
    title: 'Talk to support.',
    body: 'The event asked for human help, so the runtime selected the support surface.',
  },
  login: {
    eyebrow: 'Authentication',
    title: 'Sign in before continuing.',
    body: 'The user is not signed in, so login takes priority over the original action.',
  },
  dashboard: {
    eyebrow: 'Workspace',
    title: 'Open your workspace.',
    body: 'The user is signed in, so continue resolves to the registered workspace surface.',
  },
  details: {
    eyebrow: 'Product details',
    title: 'Show the details.',
    body: 'The event was uncertain, so the runtime selected an explanatory surface.',
  },
}

export function Surface({ name, world }: SurfaceProps) {
  const content = copy[name] ?? copy.welcome

  return (
    <section className={`surface surface--${name}`} data-surface={name}>
      <div className="surface__topline">
        <span className="eyebrow">{content.eyebrow}</span>
        <span className="surface__chip">{name}</span>
      </div>
      <div className="surface__content">
        <h2>{content.title}</h2>
        <p>{content.body}</p>
      </div>
      <div className="surface__facts">
        <div>
          <span>Plan</span>
          <strong>{world.product.plan}</strong>
        </div>
        <div>
          <span>User</span>
          <strong>{world.user.loggedIn ? 'known' : 'anonymous'}</strong>
        </div>
        <div>
          <span>Visits</span>
          <strong>{world.session.visits}</strong>
        </div>
      </div>
    </section>
  )
}
