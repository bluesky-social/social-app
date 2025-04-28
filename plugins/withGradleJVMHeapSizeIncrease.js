const {withGradleProperties} = require('expo/config-plugins')

function setGradlePropertiesValue(config, key, value) {
  return withGradleProperties(config, exportedConfig => {
    const keyIdx = exportedConfig.modResults.findIndex(
      item => item.type === 'property' && item.key === key,
    )
    if (keyIdx >= 0) {
      exportedConfig.modResults.splice(keyIdx, 1, {
        type: 'property',
        key,
        value,
      })
    } else {
      exportedConfig.modResults.push({
        type: 'property',
        key,
        value,
      })
    }

    return exportedConfig
  })
}

module.exports = function withGradleJVMHeapSizeIncrease(config) {
  config = setGradlePropertiesValue(
    config,
    'org.gradle.jvmargs',
    '-Xmx4096m -XX:MaxMetaspaceSize=1024m', //Set data of your choice
  )

  return config
}
