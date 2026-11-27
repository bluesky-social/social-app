import {Fragment, isValidElement} from 'react'
import {type I18n} from '@lingui/core'
import {Trans, type TransProps} from '@lingui/react'

/*
 * TODO: identical to `src/components/Menu/inline/getText.ts` on #12271
 * (inline native menus). Move both to one shared place once either lands.
 */

/**
 * Flattens header text, e.g. the children of `Layout.Header.TitleText`, into
 * the plain string a native header needs. Handles strings, numbers, arrays,
 * `<Trans>` (translated the same way `<Trans>` renders itself) and elements
 * that wrap any of these, such as fragments or `<Text>`. Anything else, e.g. a
 * component that computes its own text, flattens to an empty string.
 */
export function getText(node: React.ReactNode, i18n: I18n): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(child => getText(child, i18n)).join('')
  }
  if (!isValidElement<{children?: React.ReactNode}>(node)) {
    return ''
  }
  if (node.type === Trans) {
    const {id, message, values, formats} = node.props as TransProps
    const textValues = values
      ? Object.fromEntries(
          Object.entries(values).map(([key, value]) => [
            key,
            typeof value === 'number'
              ? value
              : getText(value as React.ReactNode, i18n),
          ]),
        )
      : undefined
    return (
      i18n
        ._(id, textValues, {message, formats})
        // Components are numbered tags, e.g. `<0>bold</0>`. Keep their text.
        .replace(/<\/?\d+\s*\/?>/g, '')
    )
  }
  return getText(node.props.children, i18n)
}

/**
 * Whether `getText` can flatten `node` without losing anything, i.e. every
 * leaf is text, a number, `<Trans>`, or an element wrapping only those.
 */
export function isPlainText(node: React.ReactNode): boolean {
  if (node == null || typeof node === 'boolean') return true
  if (typeof node === 'string' || typeof node === 'number') return true
  if (Array.isArray(node)) return node.every(isPlainText)
  if (!isValidElement<{children?: React.ReactNode}>(node)) return false
  if (node.type === Trans) return true
  /*
   * Only fragments are safe to look through. Anything else may style its text
   * (e.g. a bold `Text`) or render something other than its children.
   */
  return node.type === Fragment && isPlainText(node.props.children)
}
