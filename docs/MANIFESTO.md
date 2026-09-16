# Reflow Manifesto

## The old unit of product design is the flow

A designer draws boxes and arrows. An engineer turns arrows into handlers. Product behavior becomes a graph that must be edited every time the meaning changes.

That made sense when software could only execute exact instructions.

## The new unit can be the affordance

A Reflow application declares:

- what exists,
- what is safe to do,
- what the world currently looks like,
- what the user just expressed.

It does **not** need to declare every route between those things.

A policy resolves the route at interaction time.

## Copy becomes executable product intent

This is the provocative bet:

> If a button changes from “Buy Pro” to “Compare plans”, the prototype should not require an engineer to reconnect the arrow.

The sentence itself is a strong signal about intended behavior. Position, surrounding content, user state, and product state add more signal.

The runtime's job is to translate those signals into a constrained action.

## Not arbitrary code generation

Reflow is not “let the model write JavaScript on every click.”

That would destroy latency, predictability, security, and debuggability.

The host application owns the action vocabulary. The model gets freedom **inside a typed boundary**.

Think:

```text
semantic event
    ↓
fast probabilistic policy
    ↓
known safe operation
```

not:

```text
semantic event
    ↓
LLM-generated program
    ↓
pray
```

## Why now

This architecture is only compelling when semantic inference is cheap enough to sit in the normal interaction loop. A multi-second agent cannot replace a reducer. A ~100 ms decision engine starts to make the idea plausible.

## The product thesis

Reflow could collapse the distance between:

```text
idea → wording → behavior → prototype
```

The designer changes meaning. The prototype changes behavior immediately.

If this works, “wiring the flow” becomes less central to early product development. Product exploration can happen directly in the artifact instead of in a diagram that must later be reimplemented.
