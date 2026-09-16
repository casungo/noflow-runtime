import type { PropsWithChildren } from 'react'
import type { SemanticRuntime } from '../runtime/createSemanticRuntime'
import type { WorldState } from '../runtime/types'
import { extractSemanticContext } from '../runtime/domContext'

type SemanticButtonProps<Surface extends string, World extends WorldState> = PropsWithChildren<{
  id: string
  runtime: SemanticRuntime<Surface, World>
  description?: string
  position?: 'primary' | 'secondary' | 'footer'
  className?: string
  nearbyText?: string
}>

/**
 * Notice what is intentionally missing: no action-specific onClick.
 * The click is only serialized into meaning + context and handed to the runtime.
 */
export function SemanticButton<Surface extends string, World extends WorldState>({
  id,
  runtime,
  children,
  description,
  position = 'primary',
  className,
  nearbyText = '',
}: SemanticButtonProps<Surface, World>) {
  return (
    <button
      type="button"
      className={className}
      data-semantic
      onClick={(event) => {
        const label = typeof children === 'string' ? children : event.currentTarget.textContent?.trim() ?? id
        const automaticContext = extractSemanticContext(event.currentTarget)
        const context = [automaticContext, nearbyText].filter(Boolean).join('\n')

        void runtime.dispatch(
          {
            id,
            role: 'button',
            label,
            description,
            position,
          },
          context,
        )
      }}
    >
      {children}
    </button>
  )
}
