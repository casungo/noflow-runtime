import type { PropsWithChildren } from 'react'
import { useRef } from 'react'
import type { SemanticRuntime } from '../runtime/createSemanticRuntime'

type SemanticButtonProps = PropsWithChildren<{
  id: string
  runtime: SemanticRuntime
  description?: string
  position?: 'primary' | 'secondary' | 'footer'
  className?: string
  nearbyText?: string
}>

/**
 * Notice what is intentionally missing: no action-specific onClick.
 * The click is only serialized into meaning + context and handed to the runtime.
 */
export function SemanticButton({
  id,
  runtime,
  children,
  description,
  position = 'primary',
  className,
  nearbyText = '',
}: SemanticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const label = typeof children === 'string' ? children : ref.current?.textContent ?? id

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      data-semantic
      onClick={() =>
        runtime.dispatch(
          {
            id,
            role: 'button',
            label,
            description,
            position,
          },
          nearbyText,
        )
      }
    >
      {children}
    </button>
  )
}
