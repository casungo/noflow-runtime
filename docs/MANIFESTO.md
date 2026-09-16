# NoFlow manifesto

## Buttons are tiny liars

A button says `Buy Pro`. Somewhere underneath, an engineer has wired it to an arrow, a route, a modal, three conditions, and a comment that says "temporary" from 2022.

NoFlow asks a less tidy question: what if the button reported what it means and the app picked the next safe thing from there?

This is a funny idea. It may also be useful.

## The arrow is not the product

Most UI code starts with a flow:

```text
click -> /checkout
```

That is fine when the meaning never changes. Product ideas do change, usually five minutes after the flowchart is approved.

A NoFlow app declares what exists, what is allowed, what the world looks like, and what the user just expressed. It does not have to draw every possible arrow between those facts.

## Words get a vote

Change `Buy Pro` to `Compare plans`. The prototype should not need an engineer to reconnect the arrow by hand.

The label is one signal. Nearby DOM text, position, user state, product state, and previous decisions add more. The runtime sends those signals to a policy, then checks the answer against the affordances the app actually registered.

The policy can guess. It cannot invent a component or execute a surprise script.

## This is not code generation with a fake moustache

NoFlow does not ask a model to write JavaScript on every click. That would be slow, hard to debug, and a spectacular way to turn a button into a security incident.

The host app owns the allowed actions:

```text
semantic event
    ↓
policy guess
    ↓
known safe affordance
```

The runtime also has a fallback for low confidence and policy outages. Even experimental UI needs a seatbelt.

## The bet

```text
idea -> wording -> behavior -> prototype
```

Maybe this makes early product work faster. Maybe it produces interfaces that are slightly unhinged. Both outcomes are more interesting than another flowchart nobody wants to update.

NoFlow is an installable runtime and an open invitation to try the weird version of the idea. Build something sensible with it. Build something completely crazy. Then tell us whether the button knew what it was doing.
