const {withPodfile} = require('@expo/config-plugins')

const POD_LINE =
  "pod 'MCEmojiPicker', :git => 'https://github.com/bluesky-social/MCEmojiPicker.git', :branch => 'main'"

module.exports = function withMCEmojiPickerFork(config) {
  return withPodfile(config, config => {
    const contents = config.modResults.contents

    // Check if already added
    if (contents.includes(POD_LINE)) {
      return config
    }

    // Insert after use_expo_modules!
    const anchor = 'use_expo_modules!'
    if (!contents.includes(anchor)) {
      throw new Error(
        `Cannot find "${anchor}" in Podfile to insert MCEmojiPicker fork`,
      )
    }

    config.modResults.contents = contents.replace(
      anchor,
      `${anchor}\n\n  # Use maintained fork of MCEmojiPicker\n  ${POD_LINE}`,
    )

    return config
  })
}
