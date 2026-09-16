const MAX_CONTEXT_LENGTH = 1200
const LANDMARKS = new Set(['article', 'footer', 'form', 'header', 'main', 'nav', 'section'])

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function visibleText(element: HTMLElement) {
  return clean(element.innerText || element.textContent || '')
}

function describe(element: HTMLElement) {
  const tag = element.tagName.toLowerCase()
  const role = element.getAttribute('role')
  const label = element.getAttribute('aria-label')

  if (!role && !label && !LANDMARKS.has(tag) && !element.hasAttribute('data-semantic-context')) {
    return null
  }

  return [role ?? tag, label ? `"${clean(label)}"` : ''].filter(Boolean).join(' ')
}

/** Extracts a bounded, visible DOM summary for semantic policy input. */
export function extractSemanticContext(element: HTMLElement) {
  const parent = element.parentElement
  const root =
    element.closest<HTMLElement>('[data-semantic-context]') ??
    element.closest<HTMLElement>('section, article, form, main') ??
    parent ??
    element
  const hierarchy: string[] = []
  let current = element.parentElement

  while (current && hierarchy.length < 4) {
    const description = describe(current)
    if (description) hierarchy.unshift(description)
    current = current.parentElement
  }

  const context = [
    hierarchy.length ? `hierarchy: ${hierarchy.join(' > ')}` : '',
    parent && parent !== root ? `nearby: ${visibleText(parent)}` : '',
    `container: ${visibleText(root)}`,
  ]
    .filter(Boolean)
    .join('\n')

  return context.slice(0, MAX_CONTEXT_LENGTH)
}
