import type { PrimitiveName } from '../runtime/types'
import type { DemoWorldState } from '../demoTypes'

type SurfaceProps = {
  name: PrimitiveName
  world: DemoWorldState
}

const copy: Record<PrimitiveName, { eyebrow: string; title: string; body: string }> = {
  welcome: {
    eyebrow: 'Semantic surface',
    title: 'Your product, without the arrow maze.',
    body: 'The interface exposes affordances. The policy makes a guess about which one should show up next.',
  },
  checkout: {
    eyebrow: 'Chosen at runtime',
    title: 'Checkout appeared.',
    body: 'The button did not point here. Its meaning plus the world state got the vote.',
  },
  comparison: {
    eyebrow: 'Chosen at runtime',
    title: 'A comparison is more useful now.',
    body: 'The same button can become a different transition when its copy changes. Slightly cursed, quite handy.',
  },
  trial: {
    eyebrow: 'Chosen at runtime',
    title: 'Start a free trial.',
    body: 'The runtime guessed that exploration was the mood and showed the trial affordance.',
  },
  support: {
    eyebrow: 'Chosen at runtime',
    title: 'Human help, immediately.',
    body: 'Help is part of the interaction loop, not a chatbot maze bolted on later.',
  },
  login: {
    eyebrow: 'Chosen at runtime',
    title: 'Sign in before continuing.',
    body: 'World state can overrule the most obvious interpretation of a click.',
  },
  dashboard: {
    eyebrow: 'Chosen at runtime',
    title: 'Welcome back to your workspace.',
    body: 'A vague "Continue" can mean something different when the user is already logged in.',
  },
  details: {
    eyebrow: 'Chosen at runtime',
    title: 'Show more context, not another funnel step.',
    body: 'When the intent is fuzzy, the UI can explain instead of forcing another route.',
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
