/* eslint-disable bsky-internal/keep-i18n-patch-in-sync */
const LOCALE_DATA_FOLDER = '@formatjs/intl-pluralrules/locale-data/'
const GEN_MODULE_PATH =
  '@formatjs/intl-pluralrules/supported-locales.generated.js'

exports.create = function create(context) {
  delete require.cache[require.resolve(GEN_MODULE_PATH)]
  const {supportedLocales} = require(GEN_MODULE_PATH)
  return {
    Literal(node) {
      if (typeof node.value !== 'string') {
        return
      }
      if (!node.value.startsWith(LOCALE_DATA_FOLDER)) {
        return
      }
      const code = node.value.slice(LOCALE_DATA_FOLDER.length)
      if (!supportedLocales.includes(code)) {
        context.report({
          node,
          message:
            'Edit .patches/@formatjs+intl-pluralrules+XXX.patch to include ' +
            code,
        })
      }
    },
  }
}
