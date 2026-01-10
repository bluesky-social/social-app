'use strict'

const plugin = {
  meta: {
    name: 'eslint-plugin-bsky-internal',
    version: '1.0.0',
  },
  rules: {
    'avoid-unwrapped-text': require('./avoid-unwrapped-text'),
    'use-exact-imports': require('./use-exact-imports'),
    'use-typed-gates': require('./use-typed-gates'),
    'use-prefixed-imports': require('./use-prefixed-imports'),
  },
}

module.exports = plugin
