const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const EDITABLE_ROLES = new Set([
  'textbox',
  'searchbox',
  'combobox',
  'spinbutton',
  'slider',
  'listbox',
  'scrollbar',
])

/**
 * Whether an event target is a control that uses arrow keys or pointer drags
 * itself (text fields, selects, sliders, and so on). The gallery must not
 * hijack those.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el !== 'object' || !('tagName' in el)) return false
  let node: HTMLElement | null = el
  while (node) {
    if (EDITABLE_TAGS.has(node.tagName)) return true
    if (node.isContentEditable) return true
    const role = node.getAttribute?.('role')
    if (role && EDITABLE_ROLES.has(role)) return true
    node = node.parentElement
  }
  return false
}
