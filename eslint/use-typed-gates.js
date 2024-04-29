'use strict'

exports.create = function create(context) {
  return {
    ImportSpecifier(node) {
      if (
        !node.local ||
        node.local.type !== 'Identifier' ||
        node.local.name !== 'useGate'
      ) {
        return
      }
      if (
        node.parent.type !== 'ImportDeclaration' ||
        !node.parent.source ||
        node.parent.source.type !== 'Literal'
      ) {
        return
      }
      const source = node.parent.source.value
      if (source.startsWith('statsig') || source.startsWith('@statsig')) {
        context.report({
          node,
          message:
            "Use useGate() from '#/lib/statsig/statsig' instead of the one on npm.",
        })
      }
      // TODO: Verify gate() call results aren't stored in variables.
    },
  }
}
