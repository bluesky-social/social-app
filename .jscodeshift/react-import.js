/**
 * Codemod to replace namespaced React calls with named imports
 *
 * Before:
 *   import React from 'react'
 *   React.useEffect(() => {}, [])
 *
 * After:
 *   import { useEffect } from 'react'
 *   useEffect(() => {}, [])
 *
 * Usage: jscodeshift -t .jscodeshift/react-import.js <file-path>
 * Example: jscodeshift -t .jscodeshift/react-import.js src/App.native.tsx
 */

/* eslint-disable */

export const parser = 'tsx'

export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Find the React import
  let reactImportPath = null
  const reactMembers = new Set()

  root.find(j.ImportDeclaration).forEach(path => {
    const node = path.value
    if (node.source.value === 'react') {
      node.specifiers.forEach(spec => {
        // Check if this is a default import of React
        if (
          spec.type === 'ImportDefaultSpecifier' &&
          spec.local.name === 'React'
        ) {
          reactImportPath = path
        }
      })
    }
  })

  if (!reactImportPath) {
    // No React import found, nothing to do
    return file.source
  }

  // Find all React.* member expressions
  root
    .find(j.MemberExpression)
    .filter(path => {
      const node = path.value
      return (
        node.object.type === 'Identifier' &&
        node.object.name === 'React' &&
        node.property.type === 'Identifier'
      )
    })
    .forEach(path => {
      const propertyName = path.value.property.name
      reactMembers.add(propertyName)
    })

  // Find all React.* JSX member expressions (e.g., <React.Fragment>)
  root
    .find(j.JSXMemberExpression)
    .filter(path => {
      const node = path.value
      return node.object.name === 'React' && node.property.name
    })
    .forEach(path => {
      const propertyName = path.value.property.name
      reactMembers.add(propertyName)
    })

  // If no React members are used, remove the import
  if (reactMembers.size === 0) {
    reactImportPath.prune()
    return root.toSource()
  }

  // Sort the members for consistent output
  const sortedMembers = Array.from(reactMembers).sort()

  // Create new import specifiers
  const newSpecifiers = sortedMembers.map(name =>
    j.importSpecifier(j.identifier(name), j.identifier(name)),
  )

  // Get the existing import specifiers
  const sortedImports = Array.from(reactImportPath.value.specifiers).sort()
  const existingSpecifiers = sortedImports.filter(
    specifier => specifier.type !== 'ImportDefaultSpecifier',
  )

  const allSpecifiers = [
    ...new Map(
      [...existingSpecifiers, ...newSpecifiers].map(item => [
        item.imported.name,
        item,
      ]),
    ).values(),
  ]

  // Update the import declaration
  reactImportPath.value.specifiers = allSpecifiers

  // Replace all React.* member expressions with just the identifier
  root
    .find(j.MemberExpression)
    .filter(path => {
      const node = path.value
      return (
        node.object.type === 'Identifier' &&
        node.object.name === 'React' &&
        node.property.type === 'Identifier'
      )
    })
    .replaceWith(path => {
      return j.identifier(path.value.property.name)
    })

  // Replace all React.* JSX member expressions with just the identifier
  root
    .find(j.JSXMemberExpression)
    .filter(path => {
      const node = path.value
      return node.object.name === 'React' && node.property.name
    })
    .replaceWith(path => {
      return j.jsxIdentifier(path.value.property.name)
    })

  return root.toSource()
}
