/**
 * Flags `style={flatten(...)}` (or `StyleSheet.flatten(...)`). On web, ALF's
 * atoms only render as CSS classes while they keep their identity, so a
 * flattened copy renders every atom inline and drops `hover()` styles.
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow rendering a flattened style',
    },
    schema: [],
    messages: {
      flattened:
        "Don't render a flattened style: on web it renders every atom inline instead of as a CSS class, and drops hover() styles. Pass the style array as-is. For a Radix `asChild` child, use SlotView/SlotPressable/SlotText from '#/components/Slot'; for a DOM element, use flattenToCSS.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'style') {
          return
        }
        if (node.value?.type !== 'JSXExpressionContainer') {
          return
        }
        const expression = node.value.expression
        if (isFlattenCall(expression)) {
          context.report({node: expression, messageId: 'flattened'})
        }
      },
    }
  },
}

function isFlattenCall(node) {
  if (node.type !== 'CallExpression') return false
  const callee = node.callee
  if (callee.type === 'Identifier') {
    return callee.name === 'flatten'
  }
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'flatten'
  )
}
