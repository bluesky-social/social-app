import {Fragment, isValidElement} from 'react'
import {type I18nContext, Trans, type TransProps} from '@lingui/react'

export const UNSUPPORTED = Symbol('unsupported text content')
export const NEEDS_TRANSLATION = Symbol('text needs Lingui context')
type Resolution = string | typeof UNSUPPORTED | typeof NEEDS_TRANSLATION

/**
 * Lowers only primitives, transparent fragments, and Lingui's known descriptor
 * component. Never calls a component, reads a fiber, or guesses its output.
 * The first pass validates the whole tree before invoking any translations.
 */
export function resolveText(
  child: React.ReactNode,
  lingui?: I18nContext,
  depth = 0,
): Resolution {
  if (typeof child === 'string') return child
  if (child == null || typeof child === 'boolean') return ''
  if (typeof child === 'number' || typeof child === 'bigint')
    return String(child)
  if (depth > 64) return UNSUPPORTED

  if (Array.isArray(child)) {
    let text = ''
    let needsTranslation = false
    for (const item of child) {
      const value = resolveText(item, lingui, depth + 1)
      if (value === UNSUPPORTED) return UNSUPPORTED
      if (value === NEEDS_TRANSLATION) needsTranslation = true
      else text += value
    }
    return needsTranslation ? NEEDS_TRANSLATION : text
  }

  if (!isValidElement(child)) return UNSUPPORTED
  if (child.type === Fragment) {
    const props = child.props as {children?: React.ReactNode; ref?: unknown}
    if (props.ref != null) return UNSUPPORTED
    return resolveText(props.children, lingui, depth + 1)
  }
  if (child.type !== Trans) return UNSUPPORTED

  const props = child.props as TransProps & {ref?: unknown}
  if (
    props.components != null ||
    props.render !== undefined ||
    props.component !== undefined ||
    props.ref != null
  )
    return UNSUPPORTED

  for (const value of Object.values(props.values ?? {})) {
    if (typeof value !== 'string' && typeof value !== 'number')
      return UNSUPPORTED
  }
  if (!lingui) return NEEDS_TRANSLATION
  if (lingui.defaultComponent) return UNSUPPORTED

  const translated = lingui.i18n._(props.id, props.values, {
    message: props.message,
    formats: props.formats,
  })
  /* Let Lingui interpret markup, including tags introduced by a catalog. */
  return typeof translated === 'string' && !translated.includes('<')
    ? translated
    : UNSUPPORTED
}
