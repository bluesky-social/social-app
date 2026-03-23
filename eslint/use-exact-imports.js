const BANNED_IMPORTS = [
  '@fortawesome/free-regular-svg-icons',
  '@fortawesome/free-solid-svg-icons',
]

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent importing entire icon packages',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source
        if (typeof source.value !== 'string') {
          return
        }
        if (BANNED_IMPORTS.includes(source.value)) {
          context.report({
            node,
            message:
              'Import the specific thing you want instead of the entire package',
          })
        }
      },
    }
  },
}
