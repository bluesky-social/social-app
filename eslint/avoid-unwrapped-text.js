'use strict'

// Partially based on eslint-plugin-react-native.
// Portions of code by Alex Zhukov, MIT license.

function hasOnlyLineBreak(value) {
  return /^[\r\n\t\f\v]+$/.test(value.replace(/ /g, ''))
}

function getTagName(node) {
  const reversedIdentifiers = []
  if (
    node.type === 'JSXElement' &&
    node.openingElement.type === 'JSXOpeningElement'
  ) {
    let object = node.openingElement.name
    while (object.type === 'JSXMemberExpression') {
      if (object.property.type === 'JSXIdentifier') {
        reversedIdentifiers.push(object.property.name)
      }
      object = object.object
    }

    if (object.type === 'JSXIdentifier') {
      reversedIdentifiers.push(object.name)
    }
  }

  return reversedIdentifiers.reverse().join('.')
}

exports.create = function create(context) {
  const options = context.options[0] || {}
  const impliedTextComponents = options.impliedTextComponents
    ? options.impliedTextComponents
    : []
  const textComponents = ['Text', ...impliedTextComponents]
  return {
    // TODO: Validate expressions.
    // TODO: Validate text in props separately from children.
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
        const tagName = getTagName(parent)
        if (textComponents.includes(tagName) || tagName.endsWith('Text')) {
          // We're good.
          return
        }
        if (tagName === 'Trans') {
          // Skip over it and check above.
          // TODO: Maybe validate that it's present.
          parent = parent.parent
          continue
        }
        let message = 'Wrap this string in <Text>.'
        if (tagName !== 'View') {
          message +=
            ' If <' +
            tagName +
            '> is guaranteed to render <Text>, ' +
            'rename it to <' +
            tagName +
            'Text> or add it to impliedTextComponents.'
        }
        context.report({
          node,
          message,
        })
        return
      }
    },
  }
}
