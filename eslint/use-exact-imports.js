/* eslint-disable bsky-internal/use-exact-imports */
const BANNED_IMPORTS = [
  '@fortawesome/free-regular-svg-icons',
  '@fortawesome/free-solid-svg-icons',
]

exports.create = function create(context) {
  return {
    Literal(node) {
      if (typeof node.value !== 'string') {
        return
      }
      if (BANNED_IMPORTS.includes(node.value)) {
        context.report({
          node,
          message:
            'Import the specific thing you want instead of the entire package',
        })
      }
    },
  }
}
