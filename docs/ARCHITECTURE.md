# Architecture

## Interaction loop

```text
┌──────────────┐
│ DOM / React  │
└──────┬───────┘
       │ click / submit / change
       ▼
┌────────────────────┐
│ semantic serializer│
│ target + context   │
└─────────┬──────────┘
          ▼
┌────────────────────┐
│ SemanticPolicy     │
│ mock / Jev / other │
└─────────┬──────────┘
          │ typed decision + probabilities
          ▼
┌────────────────────┐
│ SemanticRuntime    │
│ validation + apply │
└─────────┬──────────┘
          ▼
┌────────────────────┐
│ affordance registry│
│ surfaces + tools   │
└─────────┬──────────┘
          ▼
       render
```

## Core contracts

`SemanticEvent` is observation, not instruction. A semantic button says what the user interacted with; it does not encode where to go.

`SemanticPolicy` is replaceable. The browser does not care whether the decision comes from Jev, a local model, heuristics, an eval harness, or a replay fixture.

`UIAction` is the capability boundary. Production versions should validate actions before applying them and require explicit confirmation for consequential tools.

## Why one Choice is useful

For the current demo, all registered surfaces form a finite affordance catalog. Jev's `Choice` primitive maps naturally to selecting one next surface and returns the full distribution, not only the winner.

Additional independent questions can run in the same request, for example:

- is the interaction ambiguous?
- does this require confirmation?
- should data be prefetched?
- is this likely to be a destructive intent?

That turns one UI event into a bundle of parallel semantic judgments.

## Production direction

The next version should separate:

1. **decision** — which intent/capability is appropriate;
2. **planning** — which safe operation realizes it;
3. **rendering** — how that operation maps to the component tree.

This allows caching, speculative prefetch, policy evals, and deterministic fallbacks without coupling the model to React.
