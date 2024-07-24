const {withAppDelegate} = require('@expo/config-plugins')
const {mergeContents} = require('@expo/config-plugins/build/utils/generateCode')
const path = require('path')
const fs = require('fs')

module.exports = config => {
  // eslint-disable-next-line no-shadow
  return withAppDelegate(config, async config => {
    const delegatePath = path.join(
      config.modRequest.platformProjectRoot,
      'AppDelegate.mm',
    )

    let newContents = config.modResults.contents
    newContents = mergeContents({
      src: newContents,
      anchor: '// Linking API',
      newSrc: `
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:options[UIApplicationOpenURLOptionsSourceApplicationKey] forKey:@"referrerApp"];\n`,
      offset: 2,
      tag: 'referrer info - deep links',
      comment: '//',
    }).contents

    newContents = mergeContents({
      src: newContents,
      anchor: '// Universal Links',
      newSrc: `
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setURL:userActivity.referrerURL forKey:@"referrer"];\n`,
      offset: 2,
      tag: 'referrer info - universal links',
      comment: '//',
    }).contents

    config.modResults.contents = newContents

    return config
  })
}
