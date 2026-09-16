# NoFlow

> **Buttons don't have handlers. They have meaning.**

NoFlow is an experimental semantic UI runtime for a different way of building web products:

```text
user event → semantic event → fast policy → typed UI mutation → render
```

Instead of programming every transition (`button A → modal B → route C`), the app exposes a set of **affordances** and a fast policy chooses the most appropriate next mutation from the current meaning + world-state.

This repository is a runnable concept, intentionally small enough to understand in one sitting.

## Why this could matter

Traditional prototyping couples copy and flow logic:

```tsx
<button onClick={() => navigate('/checkout')}>Buy Pro</button>
```

NoFlow moves the behavior out of the button:

```tsx
<SemanticButton id="hero-cta">{label}</SemanticButton>
```

The runtime serializes the interaction into a semantic event:

```json
{
  "target": {
    "role": "button",
    "label": "Compare plans",
    "position": "primary"
  },
  "world": {
    "user": { "loggedIn": true },
    "product": { "plan": "pro", "price": 29 }
  },
  "affordances": ["checkout", "comparison", "trial", "support"]
}
```

A policy returns a typed decision:

```json
{
  "action": {
    "type": "present",
    "component": "comparison"
  },
  "confidence": 0.94
}
```

Change the text to **Buy Pro** and the same button can resolve to `checkout`. No flow graph changed.

## Run it

```bash
npm install
npm run dev
```

Then open the local Vite URL.

The included policy is a local mock with an artificial ~70–125 ms delay so the concept works without credentials.

## Project structure

```text
src/
├── components/
│   ├── SemanticButton.tsx   # emits meaning, not domain behavior
│   └── Surface.tsx          # example UI primitives / affordances
├── runtime/
│   ├── types.ts             # event + typed action contract
│   ├── createSemanticRuntime.ts
│   ├── mockPolicy.ts        # runnable local stand-in
│   ├── httpPolicy.ts        # production server adapter
│   └── useSemanticRuntime.ts
└── App.tsx                  # interactive concept demo
```

## The design rule

**Flows are not predefined. Primitives are.**

NoFlow should not let a model generate arbitrary executable JavaScript. The host app owns a finite catalog of safe affordances:

- present component
- update state
- navigate
- call registered tool
- request confirmation
- no-op

The policy chooses among them. This is closer to an operating system syscall boundary than free-form code generation.

## Plugging in Jev

Keep model credentials off the browser. Replace `MockSemanticPolicy` with `HttpSemanticPolicy`:

```ts
const runtime = new SemanticRuntime(
  new HttpSemanticPolicy('/api/semantic-transition'),
  initialWorld,
)
```

Your server endpoint receives the `SemanticEvent` and asks Jev for typed probabilistic outputs. One useful shape is to score each registered affordance independently, then select the highest score above your confidence threshold.

Pseudo-server logic:

```ts
const event = await request.json()

const scores = await jev.evaluate({
  state: event,
  questions: event.affordances.map((name) => ({
    id: name,
    question: `Should the UI present the ${name} affordance next?`,
    output: 'score',
  })),
})

const best = maxBy(scores, 'score')

return {
  action: {
    type: 'present',
    component: best.id,
    reason: 'Highest semantic fit for this event and world-state.'
  },
  confidence: best.score,
  candidates: topK(scores, 4),
  model: 'jev',
  latencyMs
}
```

Adapt the exact server call to the current Jev SDK/API. The frontend contract is deliberately provider-agnostic.

## What makes this different from generative UI

Generative UI commonly looks like:

```text
prompt → agent → generated UI
```

NoFlow targets the much tighter interaction loop:

```text
click / submit / drag / API event
              ↓
       semantic reducer
              ↓
       typed UI mutation
```

The interesting requirement is latency. If a policy responds in roughly interaction-scale time, semantic decisions can move from “AI feature” into the normal event loop of an application.

## Next experiments

1. **DOM context extraction** — automatically summarize labels, nearby copy, hierarchy and position.
2. **Tool affordances** — let the policy choose safe registered tools, not only surfaces.
3. **Speculative transitions** — predict likely next actions on hover/pointer-down and prefetch before click.
4. **Confidence gates** — deterministic fallback below a threshold.
5. **Replay/evals** — save semantic events and compare policy versions offline.
6. **Constraint layer** — require confirmation for irreversible or expensive actions.
7. **A2UI bridge** — map NoFlow actions to an agent-driven UI protocol.
8. **Visual editor** — edit copy and spatial hierarchy while seeing semantic behavior update live.

## Principle

The product designer edits **meaning**.

The runtime owns **translation from meaning to behavior**.

That is the bet.

## Status

Concept / experiment. Not production-ready. The local policy uses simple heuristics and exists only to make the architecture tangible without external services.

## License

MIT
