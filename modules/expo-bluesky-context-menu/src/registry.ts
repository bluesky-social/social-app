/**
 * Marker keys and type tags shared between `Root`, `Trigger`, `Menu`, and
 * `MenuItem*`. `Root` walks its children looking for these tags so the
 * composition API doesn't rely on string component names or display names.
 */
export const CONTEXT_MENU_KIND = '__ExpoBlueskyContextMenuKind__'

export type ContextMenuKind =
  | 'trigger'
  | 'menu'
  | 'item'
  | 'item-icon'
  | 'item-text'

export type TaggedComponent<P> = React.FunctionComponent<P> & {
  [CONTEXT_MENU_KIND]: ContextMenuKind
}

export function tag<P>(
  component: React.FunctionComponent<P>,
  kind: ContextMenuKind,
): TaggedComponent<P> {
  ;(component as TaggedComponent<P>)[CONTEXT_MENU_KIND] = kind
  return component as TaggedComponent<P>
}

export function kindOf(type: unknown): ContextMenuKind | undefined {
  if (type && typeof type === 'function') {
    return (type as TaggedComponent<unknown>)[CONTEXT_MENU_KIND]
  }
  return undefined
}
