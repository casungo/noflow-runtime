# NoFlow

NoFlow is a semantic interaction runtime for React. Components emit meaning, a policy selects one registered affordance, and the runtime applies the typed transition.

## Install

```bash
npm install noflow-runtime
```

React 18.2 or newer is required. NoFlow does not add a router, state manager, or model SDK to the client bundle.

## Use it in a new app

```tsx
import { SemanticRuntime, HttpSemanticPolicy } from 'noflow-runtime/core'
import { SemanticButton, useSemanticRuntime } from 'noflow-runtime/react'

type Surface = 'welcome' | 'checkout' | 'support'
type World = Record<string, unknown> & { loggedIn: boolean }

const runtime = new SemanticRuntime(
  new HttpSemanticPolicy<Surface, World>('/api/semantic-transition'),
  { loggedIn: true },
  {
    affordances: ['welcome', 'checkout', 'support'],
    initialSurface: 'welcome',
    confidenceThreshold: 0.65,
    confirmationThreshold: 0.7,
    fallbackSurface: 'welcome',
    confirm: ({ target }) => window.confirm(`Continue with "${target.label}"?`),
  },
)

function App() {
  const snapshot = useSemanticRuntime(runtime)

  return (
    <>
      <p>Current surface: {snapshot.surface}</p>
      <SemanticButton runtime={runtime} id="primary-cta" position="primary">
        Buy Pro
      </SemanticButton>
    </>
  )
}
```

The button has no domain-specific `onClick`. Its label, visible DOM context, position, world state, and registered affordances become a `SemanticEvent`.

`SemanticButton` extracts a bounded summary from its nearest semantic container, section, article, form, or main element. Add `data-semantic-context` to a container to choose the extraction boundary. The optional `nearbyText` prop remains available for context that only the application knows.

The root import remains available for compatibility, but subpath imports keep framework-specific code out of consumers that only need the core:

```ts
import { SemanticRuntime } from 'noflow-runtime/core'
import { SemanticButton } from 'noflow-runtime/react'
import { JevSemanticPolicy } from 'noflow-runtime/server'
```

`SemanticRuntime` only accepts a `present` action whose component belongs to the registered affordance list. A policy cannot render arbitrary components or execute arbitrary JavaScript.

The runtime can enforce safety gates after the policy responds. A decision below `confidenceThreshold` uses `fallbackSurface` when configured. A decision whose `safety.requiresConfirmation` reaches `confirmationThreshold` calls `confirm`; if it returns false, the runtime applies `noop` and keeps the proposed action in `policyAction` for inspection. If the policy throws, the runtime uses the registered fallback and marks the decision as `error-fallback`.

## Connect Jev

Keep the Jev key on the server. The package includes a server-side policy and a standard Web Request handler, so it works in a Node, edge, or framework route without a Vite plugin.

```ts
import { createSemanticPolicyHandler, JevSemanticPolicy } from 'noflow-runtime/server'

const policy = new JevSemanticPolicy({
  apiKey: process.env.TYPESAFE_API_KEY!,
  descriptions: {
    checkout: 'A purchase or subscription surface.',
    support: 'A help or human-assistance surface.',
  },
})

const semanticTransition = createSemanticPolicyHandler(policy)

export default function handle(request: Request) {
  return semanticTransition(request)
}
```

The browser calls your `/api/semantic-transition` route through `HttpSemanticPolicy`. Jev chooses only from the affordances sent by the runtime. It does not create routes, components, or executable code.

## Local playground

This repository also contains the interactive playground used to develop and inspect the runtime:

```bash
npm install
npm run dev
```

The playground uses a local heuristic policy by default. To use the included Vite development endpoint backed by Jev, create `.env.local`:

```env
VITE_POLICY_MODE=jev
TYPESAFE_API_KEY=your_key_here
```

That endpoint is for the playground. New applications should use `JevSemanticPolicy` in their own server route.

## Package development

```bash
npm run check:package
```

This builds the ESM package, imports it from the generated artifact, checks a runtime transition, and previews the npm tarball contents. Runtime history keeps 50 transitions by default; set `historyLimit` in the runtime options when you need a different debug window.

## Status

The package is installable and the runtime contract is reusable. The playground remains an example application, not a requirement for using NoFlow.

## License

MIT
