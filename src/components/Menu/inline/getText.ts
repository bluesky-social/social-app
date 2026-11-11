import {isValidElement} from 'react'
import {type I18n} from '@lingui/core'
import {Trans, type TransProps} from '@lingui/react'

/**
 * Flattens menu text, e.g. the children of `Menu.ItemText`, into the plain
 * string a native menu needs. Handles strings, numbers, arrays, `<Trans>`
 * (translated the same way `<Trans>` renders itself) and elements that wrap
 * any of these, such as fragments or `<Text>`. Anything else, e.g. a component
 * that computes its own text, flattens to an empty string.
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
