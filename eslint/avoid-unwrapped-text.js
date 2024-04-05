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
  const impliedTextProps = options.impliedTextProps ?? []
  const impliedTextComponents = options.impliedTextComponents ?? []
  const suggestedTextWrappers = options.suggestedTextWrappers ?? {}
  const textProps = [...impliedTextProps]
  const textComponents = ['Text', ...impliedTextComponents]

  function isTextComponent(tagName) {
    return textComponents.includes(tagName) || tagName.endsWith('Text')
  }

  return {
    JSXText(node) {
      if (typeof node.value !== 'string' || hasOnlyLineBreak(node.value)) {
        return
      }
      let parent = node.parent
      while (parent) {
        if (parent.type === 'JSXElement') {
          const tagName = getTagName(parent)
          if (isTextComponent(tagName)) {
            // We're good.
            return
          }
          if (tagName === 'Trans') {
            // Exit and rely on the traversal for <Trans> JSXElement (code below).
            // TODO: Maybe validate that it's present.
            return
          }
          const suggestedWrapper = suggestedTextWrappers[tagName]
          let message = `Wrap this string in <${suggestedWrapper ?? 'Text'}>.`
          if (tagName !== 'View' && !suggestedWrapper) {
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

        if (
          parent.type === 'JSXAttribute' &&
          parent.name.type === 'JSXIdentifier' &&
          parent.parent.type === 'JSXOpeningElement' &&
          parent.parent.parent.type === 'JSXElement'
        ) {
          const tagName = getTagName(parent.parent.parent)
          const propName = parent.name.name
          if (
            textProps.includes(tagName + ' ' + propName) ||
            propName === 'text' ||
            propName.endsWith('Text')
          ) {
            // We're good.
            return
          }
          const message =
            'Wrap this string in <Text>.' +
            ' If `' +
            propName +
            '` is guaranteed to be wrapped in <Text>, ' +
            'rename it to `' +
            propName +
            'Text' +
            '` or add it to impliedTextProps.'
          context.report({
            node,
            message,
          })
          return
        }

        parent = parent.parent
        continue
      }
    },
    Literal(node) {
      if (typeof node.value !== 'string' && typeof node.value !== 'number') {
        return
      }
      let parent = node.parent
      while (parent) {
        if (parent.type === 'JSXElement') {
          const tagName = getTagName(parent)
          if (isTextComponent(tagName)) {
            // We're good.
            return
          }
          if (tagName === 'Trans') {
            // Exit and rely on the traversal for <Trans> JSXElement (code below).
            // TODO: Maybe validate that it's present.
            return
          }
          const suggestedWrapper = suggestedTextWrappers[tagName]
          let message = `Wrap this string in <${suggestedWrapper ?? 'Text'}>.`
          if (tagName !== 'View' && !suggestedWrapper) {
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

        if (parent.type === 'BinaryExpression' && parent.operator === '+') {
          parent = parent.parent
          continue
        }

        if (
          parent.type === 'JSXExpressionContainer' ||
          parent.type === 'LogicalExpression'
        ) {
          parent = parent.parent
          continue
        }

        // Be conservative for other types.
        return
      }
    },
    TemplateLiteral(node) {
      let parent = node.parent
      while (parent) {
        if (parent.type === 'JSXElement') {
          const tagName = getTagName(parent)
          if (isTextComponent(tagName)) {
            // We're good.
            return
          }
          if (tagName === 'Trans') {
            // Exit and rely on the traversal for <Trans> JSXElement (code below).
            // TODO: Maybe validate that it's present.
            return
          }
          const suggestedWrapper = suggestedTextWrappers[tagName]
          let message = `Wrap this string in <${suggestedWrapper ?? 'Text'}>.`
          if (tagName !== 'View' && !suggestedWrapper) {
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

        if (
          parent.type === 'CallExpression' &&
          parent.callee.type === 'Identifier' &&
          parent.callee.name === '_'
        ) {
          // This is a user-facing string, keep going up.
          parent = parent.parent
          continue
        }

        if (parent.type === 'BinaryExpression' && parent.operator === '+') {
          parent = parent.parent
          continue
        }

        if (
          parent.type === 'JSXExpressionContainer' ||
          parent.type === 'LogicalExpression' ||
          parent.type === 'TaggedTemplateExpression'
        ) {
          parent = parent.parent
          continue
        }

        // Be conservative for other types.
        return
      }
    },
    JSXElement(node) {
      if (getTagName(node) !== 'Trans') {
        return
      }
      let parent = node.parent
      while (parent) {
        if (parent.type === 'JSXElement') {
          const tagName = getTagName(parent)
          if (isTextComponent(tagName)) {
            // We're good.
            return
          }
          if (tagName === 'Trans') {
            // Exit and rely on the traversal for this JSXElement.
            // TODO: Should nested <Trans> even be allowed?
            return
          }
          const suggestedWrapper = suggestedTextWrappers[tagName]
          let message = `Wrap this <Trans> in <${suggestedWrapper ?? 'Text'}>.`
          if (tagName !== 'View' && !suggestedWrapper) {
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

        if (
          parent.type === 'JSXAttribute' &&
          parent.name.type === 'JSXIdentifier' &&
          parent.parent.type === 'JSXOpeningElement' &&
          parent.parent.parent.type === 'JSXElement'
        ) {
          const tagName = getTagName(parent.parent.parent)
          const propName = parent.name.name
          if (
            textProps.includes(tagName + ' ' + propName) ||
            propName === 'text' ||
            propName.endsWith('Text')
          ) {
            // We're good.
            return
          }
          const message =
            'Wrap this <Trans> in <Text>.' +
            ' If `' +
            propName +
            '` is guaranteed to be wrapped in <Text>, ' +
            'rename it to `' +
            propName +
            'Text' +
            '` or add it to impliedTextProps.'
          context.report({
            node,
            message,
          })
          return
        }

        parent = parent.parent
        continue
      }
    },
    ReturnStatement(node) {
      let fnScope = context.getScope()
      while (fnScope && fnScope.type !== 'function') {
        fnScope = fnScope.upper
      }
      if (!fnScope) {
        return
      }
      const fn = fnScope.block
      if (!fn.id || fn.id.type !== 'Identifier' || !fn.id.name) {
        return
      }
      if (!/^[A-Z]\w*Text$/.test(fn.id.name)) {
        return
      }
      if (!node.argument || node.argument.type !== 'JSXElement') {
        return
      }
      const openingEl = node.argument.openingElement
      if (openingEl.name.type !== 'JSXIdentifier') {
        return
      }
      const returnedComponentName = openingEl.name.name
      if (!isTextComponent(returnedComponentName)) {
        context.report({
          node,
          message:
            'Components ending with *Text must return <Text> or <SomeText>.',
        })
      }
    },
  }
}
