import type { PrimitiveName } from '../runtime/types'
import type { DemoWorldState } from '../demoTypes'

type SurfaceProps = {
  name: PrimitiveName
  world: DemoWorldState
}

const copy: Record<PrimitiveName, { eyebrow: string; title: string; body: string }> = {
  welcome: {
    eyebrow: 'Semantic surface',
    title: 'Your product, without the flowchart.',
    body: 'The interface exposes affordances. The policy decides which one should exist next.',
  },
  checkout: {
    eyebrow: 'Chosen at runtime',
    title: 'Checkout appeared.',
    body: 'Nothing in the button pointed directly to this screen. Its meaning plus world-state selected it.',
  },
  comparison: {
    eyebrow: 'Chosen at runtime',
    title: 'A comparison is more useful now.',
    body: 'The same physical button can become a different transition when its copy changes.',
  },
  trial: {
    eyebrow: 'Chosen at runtime',
    title: 'Start a free trial.',
    body: 'The runtime inferred exploration intent and surfaced the trial affordance.',
  },
  support: {
    eyebrow: 'Chosen at runtime',
    title: 'Human help, immediately.',
    body: 'Intent routing is part of the interaction loop rather than a separate chatbot flow.',
  },
  login: {
    eyebrow: 'Chosen at runtime',
    title: 'Sign in before continuing.',
    body: 'World-state can override the most literal interpretation of a click.',
  },
  dashboard: {
    eyebrow: 'Chosen at runtime',
    title: 'Welcome back to your workspace.',
    body: 'A vague “Continue” can resolve differently for a returning authenticated user.',
  },
  details: {
    eyebrow: 'Chosen at runtime',
    title: 'Show more context, not another funnel step.',
    body: 'When intent is exploratory, the UI can explain instead of forcing navigation.',
  },
}

export function Surface({ name, world }: SurfaceProps) {
  const content = copy[name] ?? copy.welcome

  return (
    <section className={`surface surface--${name}`} data-surface={name}>
      <div className="surface__noise" />
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
