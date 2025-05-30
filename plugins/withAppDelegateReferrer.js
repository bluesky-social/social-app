const {withAppDelegate} = require('@expo/config-plugins')
const {mergeContents} = require('@expo/config-plugins/build/utils/generateCode')

module.exports = config =>
  withAppDelegate(config, config => {
    let contents = config.modResults.contents

    contents = mergeContents({
      src: contents,
      anchor: '// Linking API',
      newSrc: `
    // @generated begin referrer info – deep links
    let defaults = UserDefaults.standard
    defaults.set(
      options[.sourceApplication] as? String,
      forKey: "referrerApp"
    )
    // @generated end referrer info – deep links
`,
      offset: 6,
      tag: 'referrer info - deep links',
      comment: '//',
    }).contents

    contents = mergeContents({
      src: contents,
      anchor: '// Universal Links',
      newSrc: `
    // @generated begin referrer info – universal links
    let defaults = UserDefaults.standard
    defaults.set(userActivity.referrerURL, forKey: "referrer")
    // @generated end referrer info – universal links
`,
      offset: 6,
      tag: 'referrer info - universal links',
      comment: '//',
    }).contents

    config.modResults.contents = contents
    return config
  })
