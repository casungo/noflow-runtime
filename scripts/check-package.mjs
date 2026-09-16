import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { HttpSemanticPolicy, SemanticRuntime } from '../dist/core.js'
import { extractSemanticContext } from '../dist/react.js'
import { createSemanticPolicyHandler } from '../dist/server.js'

const distFiles = await readdir(new URL('../dist/', import.meta.url))
const coreFiles = distFiles.filter((name) => /^(core|core-).*\.js$/.test(name))
const coreSource = await Promise.all(
  coreFiles.map((name) => readFile(new URL(`../dist/${name}`, import.meta.url), 'utf8')),
)
if (coreSource.join('\n').match(/from ['"]react['"]/)) {
  throw new Error('core entrypoint must not import React')
}

function makeDecision(component, overrides = {}) {
  return {
    action: { type: 'present', component, reason: 'package check' },
    confidence: 1,
    candidates: [{ component, probability: 1 }],
    rationale: 'package check',
    model: 'check-policy',
    latencyMs: 0,
    safety: { ambiguity: 0, requiresConfirmation: 0 },
    resolution: 'policy',
    ...overrides,
  }
}

function makeRuntime(policy, options = {}) {
  return new SemanticRuntime(policy, { count: 0 }, {
    affordances: ['checkout', 'welcome'],
    initialSurface: 'welcome',
    ...options,
  })
}

const eventTarget = { id: 'smoke', role: 'button', label: 'Continue' }

const runtime = makeRuntime({
  async decide(event) {
    return makeDecision(event.affordances[0])
  },
})
await runtime.dispatch(eventTarget, '')
assert.equal(runtime.getSnapshot().surface, 'checkout')
assert.equal(runtime.getSnapshot().lastDecision.resolution, 'policy')

const lowConfidenceRuntime = makeRuntime({
  async decide() {
    return makeDecision('checkout', { confidence: 0.2 })
  },
}, { confidenceThreshold: 0.65, fallbackSurface: 'welcome' })
const lowConfidenceDecision = await lowConfidenceRuntime.dispatch(eventTarget, '')
assert.equal(lowConfidenceDecision.action.component, 'welcome')
assert.equal(lowConfidenceDecision.policyAction.component, 'checkout')
assert.equal(lowConfidenceDecision.resolution, 'confidence-fallback')

const confirmationRuntime = makeRuntime({
  async decide() {
    return makeDecision('checkout', {
      safety: { ambiguity: 0, requiresConfirmation: 0.9 },
    })
  },
}, {
  confirmationThreshold: 0.7,
  confirm: async () => false,
})
const declinedDecision = await confirmationRuntime.dispatch(eventTarget, '')
assert.equal(declinedDecision.action.type, 'noop')
assert.equal(declinedDecision.policyAction.component, 'checkout')
assert.equal(declinedDecision.resolution, 'confirmation-declined')

const unavailableRuntime = makeRuntime({
  async decide() {
    throw new Error('policy offline')
  },
}, { fallbackSurface: 'welcome' })
const unavailableDecision = await unavailableRuntime.dispatch(eventTarget, '')
assert.equal(unavailableDecision.action.component, 'welcome')
assert.equal(unavailableDecision.model, 'deterministic-fallback')
assert.equal(unavailableDecision.resolution, 'error-fallback')

const originalFetch = globalThis.fetch
globalThis.fetch = async () => {
  throw new Error('network offline')
}
const jevUnavailableRuntime = makeRuntime(new HttpSemanticPolicy('/api/semantic-transition'), {
  fallbackSurface: 'welcome',
})
const jevUnavailableDecision = await jevUnavailableRuntime.dispatch(eventTarget, '')
assert.equal(jevUnavailableDecision.resolution, 'error-fallback')
globalThis.fetch = originalFetch

const invalidRuntime = makeRuntime({
  async decide() {
    return makeDecision('not-registered')
  },
})
await assert.rejects(() => invalidRuntime.dispatch(eventTarget, ''), /unregistered affordance/)

class FakeElement {
  constructor(tagName, text, parentElement = null, attributes = {}) {
    this.tagName = tagName.toUpperCase()
    this.innerText = text
    this.textContent = text
    this.parentElement = parentElement
    this.attributes = attributes
  }

  getAttribute(name) {
    return this.attributes[name] ?? null
  }

  hasAttribute(name) {
    return Object.hasOwn(this.attributes, name)
  }

  closest(selector) {
    for (let current = this; current; current = current.parentElement) {
      if (selector === '[data-semantic-context]' && current.hasAttribute('data-semantic-context')) return current
      if (selector.includes('section') && current.tagName === 'SECTION') return current
    }
    return null
  }
}

const section = new FakeElement('section', 'Pricing panel', null, { 'data-semantic-context': '' })
const copy = new FakeElement('div', 'Buy Pro for €29/month', section)
const button = new FakeElement('button', 'Buy Pro', copy)
const context = extractSemanticContext(button)
assert.match(context, /hierarchy: section/)
assert.match(context, /nearby: Buy Pro for €29\/month/)
assert.match(context, /container: Pricing panel/)

const handler = createSemanticPolicyHandler({
  async decide(event) {
    return makeDecision(event.affordances[0])
  },
})
const methodResponse = await handler(new Request('https://example.test/policy', { method: 'GET' }))
assert.equal(methodResponse.status, 405)
const invalidResponse = await handler(new Request('https://example.test/policy', {
  method: 'POST',
  body: '{}',
  headers: { 'content-type': 'application/json' },
}))
assert.equal(invalidResponse.status, 400)
const validResponse = await handler(new Request('https://example.test/policy', {
  method: 'POST',
  body: JSON.stringify({
    id: 'server-check',
    type: 'activate',
    target: eventTarget,
    nearbyText: '',
    world: {},
    affordances: ['checkout'],
  }),
  headers: { 'content-type': 'application/json' },
}))
assert.equal(validResponse.status, 200)
assert.equal((await validResponse.json()).action.component, 'checkout')

console.log('package and runtime checks passed')
