'use strict'

const plugin = {
  meta: {
    name: 'eslint-plugin-bsky-internal',
    version: '1.0.0',
  },
  rules: {
    'avoid-unwrapped-text': require('./avoid-unwrapped-text'),
    'use-prefixed-imports': require('./use-prefixed-imports'),
    'lingui-msg-rule': require('./lingui-msg-rule'),
    'no-flatten-in-style-prop': require('./no-flatten-in-style-prop'),
    'no-hover-in-flatten': require('./no-hover-in-flatten'),
  },
}

module.exports = plugin
