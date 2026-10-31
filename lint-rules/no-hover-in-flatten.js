/**
 * Flags `hover()` styles passed to `flatten`, `flattenToCSS` or
 * `StyleSheet.flatten`. Their values are CSS class names rather than style
 * values, so flattening drops them (or, with a plain object spread, turns every
 * value in the merged style into a class name).
 */

const FLATTEN_NAMES = new Set(['flatten', 'flattenToCSS'])

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow flattening hover() styles',
    },
    schema: [],
    messages: {
      hoverFlattened:
        'hover() styles hold CSS class names, so flattening drops them. Pass the style array straight to a style prop instead.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isFlattenCall(node)) return
        for (const argument of node.arguments) {
          const hover = findHoverCall(argument)
          if (hover) {
            context.report({node: hover, messageId: 'hoverFlattened'})
          }
        }
      },
    }
  },
}

function isFlattenCall(node) {
  const callee = node.callee
  if (callee.type === 'Identifier') {
    return FLATTEN_NAMES.has(callee.name)
  }
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    FLATTEN_NAMES.has(callee.property.name)
  )
}

/**
 * Finds a `hover(...)` call in a style expression, looking through arrays,
 * `cond && style` and `cond ? a : b`.
 */
function findHoverCall(node) {
  if (!node) return null
  switch (node.type) {
    case 'CallExpression':
      return node.callee.type === 'Identifier' && node.callee.name === 'hover'
        ? node
        : null
    case 'ArrayExpression':
      for (const element of node.elements) {
        const found = findHoverCall(element)
        if (found) return found
      }
      return null
    case 'LogicalExpression':
      return findHoverCall(node.left) || findHoverCall(node.right)
    case 'ConditionalExpression':
      return findHoverCall(node.consequent) || findHoverCall(node.alternate)
    default:
      return null
  }
}
