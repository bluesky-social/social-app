'use strict'

exports.meta = {
  type: 'problem',
  hasSuggestions: true,
  fixable: true,
}

const hasOnlyLineBreak = value =>
  /^[\r\n\t\f\v]+$/.test(value.replace(/ /g, ''))

exports.create = function create(context) {
  return {
    JSXText(node) {
      if (typeof node.value !== 'string' || hasOnlyLineBreak(node.value)) {
        return
      }
      let parent = node.parent
      while (parent) {
        if (parent.type !== 'JSXElement') {
          parent = parent.parent
          continue
        }
        if (parent.openingElement.name.name !== 'Text') {
          context.report({
            node,
            message: 'Wrap strings in <Text>.',
          })
        }
        break
      }
    },
  }
}
