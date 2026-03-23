const BANNED_IMPORT_PREFIXES = [
  'alf/',
  'components/',
  'lib/',
  'locale/',
  'logger/',
  'platform/',
  'state/',
  'storage/',
  'view/',
]

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using prefixed imports for internal paths',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source
        if (typeof source.value !== 'string') {
          return
        }
        if (
          BANNED_IMPORT_PREFIXES.some(banned => source.value.startsWith(banned))
        ) {
          context.report({
            node: source,
            message: `Use '#/${source.value}'`,
            fix(fixer) {
              return fixer.replaceText(source, `'#/${source.value}'`)
            },
          })
        }
      },
    }
  },
}
