/**
 * What each `Layout.Header.*` part is, so the native header can read a header
 * written as JSX without importing the components (which would be a require
 * cycle, since they render the native header).
 */
export type HeaderRole =
  'back' | 'menu' | 'content' | 'title' | 'subtitle' | 'slot'

const roles = new WeakMap<object, HeaderRole>()

export function setHeaderRole(component: object, role: HeaderRole) {
  roles.set(component, role)
}

export function getHeaderRole(type: unknown): HeaderRole | undefined {
  return typeof type === 'function' || (typeof type === 'object' && type)
    ? roles.get(type)
    : undefined
}
