/**
 * Codemod to replace namespaced React calls with named imports
 *
 * Before:
 *   import * as Toast from '#/view/com/util/Toast'
 *   Toast.show(message, 'xmark')
 *
 * After:
 *   import * as Toast from '#/components/Toast'
 *   Toast.show(message, {type: 'error'})
 *
 * Usage: jscodeshift -t .jscodeshift/toast-v2.js <file-path>
 * Example: jscodeshift -t .jscodeshift/toast-v2.js src/App.native.tsx
 */

/* eslint-disable */

export const parser = 'tsx'

const OLD_IMPORT = '#/view/com/util/Toast'
const NEW_IMPORT = '#/components/Toast'

const convertLegacyToastType = type => {
  switch (type) {
    // these ones are fine
    case 'default':
    case 'success':
    case 'error':
    case 'warning':
    case 'info':
      return type
    // legacy ones need conversion
    case 'xmark':
      return 'error'
    case 'exclamation-circle':
      return 'warning'
    case 'check':
      return 'success'
    case 'clipboard-check':
      return 'success'
    case 'circle-exclamation':
    case 'exclamation-circle':
      return 'warning'
    default:
      return 'default'
  }
}

export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Find Toast import declarations using the old path
  const toastImports = root
    .find(j.ImportDeclaration)
    .filter(path => path.value.source.value === OLD_IMPORT)

  if (toastImports.length === 0) {
    return file.source
  }

  // Update import path
  toastImports.forEach(path => {
    path.value.source.value = NEW_IMPORT
  })

  // Collect all local names the Toast namespace is bound to
  const toastLocalNames = new Set()
  toastImports.forEach(path => {
    path.value.specifiers.forEach(spec => {
      if (spec.type === 'ImportNamespaceSpecifier') {
        toastLocalNames.add(spec.local.name)
      }
    })
  })

  // Transform Toast.show(message, type) calls
  root.find(j.CallExpression).forEach(path => {
    const {callee, arguments: args} = path.value

    // Match <ToastName>.show(...)
    if (
      callee.type !== 'MemberExpression' ||
      callee.object.type !== 'Identifier' ||
      !toastLocalNames.has(callee.object.name) ||
      callee.property.name !== 'show'
    ) {
      return
    }

    // Only transform 2-arg calls where the second arg is a string literal
    if (args.length !== 2) return
    const typeArg = args[1]
    if (typeArg.type !== 'StringLiteral' && typeArg.type !== 'Literal') return

    const legacyType = typeArg.value
    const newType = convertLegacyToastType(legacyType)

    // Replace the second argument with an options object: {type: 'newType'}
    args[1] = j.objectExpression([
      j.property('init', j.identifier('type'), j.stringLiteral(newType)),
    ])
  })

  return root.toSource()
}
