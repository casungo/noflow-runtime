# How NoFlow works

One click, some context, one policy call, one registered result. That is the trick. The slightly alarming part is that it works without a route graph.

## Interaction loop

```text
┌──────────────┐
│ DOM / React  │
└──────┬───────┘
       │ click / submit / change
       ▼
┌────────────────────┐
│ semantic serializer│
│ what did they mean?│
└─────────┬──────────┘
          ▼
┌────────────────────┐
│ SemanticPolicy     │
│ mock / Jev / other │
└─────────┬──────────┘
          │ best guess + probabilities
          ▼
┌────────────────────┐
│ SemanticRuntime    │
│ is that allowed?   │
└─────────┬──────────┘
          ▼
┌────────────────────┐
│ affordance registry│
│ known safe choices │
└─────────┬──────────┘
          ▼
       render
```

## The boring, useful contracts

`SemanticEvent` is an observation, not an instruction. A semantic button says what the user interacted with; it does not hard-code where to go.

`SemanticPolicy` is replaceable. The browser does not care whether the guess comes from Jev, a local model, a heuristic, an eval harness, or a replay fixture.

`UIAction` is the capability boundary. The runtime validates actions before applying them, falls back when confidence is low, and can ask for confirmation before consequential work. Vibes are not a permission system.

## Why one Choice is enough for now

The registered surfaces form a finite affordance catalog. Jev's `Choice` primitive maps naturally to selecting one next surface and returns the full distribution, not only the winner.

Additional questions can run in the same request, for example:

- is the interaction ambiguous?
- does this require confirmation?
- should data be prefetched?
- is this likely to be a destructive intent?

That turns one UI event into a few useful signals instead of one mysterious yes-or-no answer.

## What is deliberately not here yet

The next serious version may separate:

1. **decision:** which intent or capability is appropriate;
2. **planning:** which safe operation realizes it;
3. **rendering:** how that operation maps to the component tree.

That would allow caching, prefetching, policy evals, and deterministic fallbacks without coupling the model to React. For now, the runtime sticks to one job and tries not to grow a second head.
