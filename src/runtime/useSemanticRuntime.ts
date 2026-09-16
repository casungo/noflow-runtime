import { useSyncExternalStore } from 'react'
import { SemanticRuntime } from './createSemanticRuntime'
import type { RuntimeSnapshot } from './createSemanticRuntime'
import type { WorldState } from './types'

export function useSemanticRuntime<Surface extends string, World extends WorldState>(
  runtime: SemanticRuntime<Surface, World>,
): RuntimeSnapshot<Surface, World> {
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot)
}
