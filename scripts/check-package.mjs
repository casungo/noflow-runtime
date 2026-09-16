import { readFile } from 'node:fs/promises'
import { SemanticRuntime } from '../dist/core.js'

const coreSource = await readFile(new URL('../dist/core.js', import.meta.url), 'utf8')
if (coreSource.includes('from "react"')) throw new Error('core entrypoint must not import React')

const policy = {
  async decide(event) {
    return {
      action: {
        type: 'present',
        component: event.affordances[0],
        reason: 'package smoke check',
      },
      confidence: 1,
      candidates: [{ component: event.affordances[0], probability: 1 }],
      rationale: 'package smoke check',
      model: 'smoke-check',
      latencyMs: 0,
    }
  },
}

const runtime = new SemanticRuntime(policy, { count: 0 }, {
  affordances: ['checkout'],
  initialSurface: 'checkout',
})

await runtime.dispatch({ id: 'smoke', role: 'button', label: 'Continue' }, '')
if (runtime.getSnapshot().surface !== 'checkout') throw new Error('runtime smoke check failed')

console.log('package smoke check passed')
