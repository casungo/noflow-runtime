import { useSyncExternalStore } from 'react'
import { SemanticRuntime } from './createSemanticRuntime'

export function useSemanticRuntime(runtime: SemanticRuntime) {
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot)
}
