const {IOSConfig, withXcodeProject} = require('expo/config-plugins')

function mutateXcodeProjectWithAutoCodeSigningInfo({project, appleTeamId}) {
  const targets = IOSConfig.Target.findSignableTargets(project)
  const quotedAppleTeamId = ensureQuotes(appleTeamId)
  for (const [nativeTargetId, nativeTarget] of targets) {
    IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      nativeTarget.buildConfigurationList,
    )
      .filter(
        ([, item]) => item.buildSettings.PRODUCT_NAME && item.name === 'Debug',
      )
      .forEach(([, item]) => {
        item.buildSettings.DEVELOPMENT_TEAM = quotedAppleTeamId
        item.buildSettings.CODE_SIGN_IDENTITY = '"Apple Development"'
        item.buildSettings.CODE_SIGN_STYLE = 'Automatic'
      })
    Object.entries(IOSConfig.XcodeUtils.getProjectSection(project))
      .filter(IOSConfig.XcodeUtils.isNotComment)
      .forEach(([, item]) => {
        if (!item.attributes.TargetAttributes) {
          item.attributes.TargetAttributes = {}
        }
        if (!item.attributes.TargetAttributes[nativeTargetId]) {
          item.attributes.TargetAttributes[nativeTargetId] = {}
        }
        item.attributes.TargetAttributes[nativeTargetId].DevelopmentTeam =
          quotedAppleTeamId
        item.attributes.TargetAttributes[nativeTargetId].ProvisioningStyle =
          'Automatic'
      })
  }
  return project
}

const ensureQuotes = value => {
  if (!value.match(/^['"]/)) {
    return `"${value}"`
  }
  return value
}

const withDevSigning = (config, teamId) => {
  return withXcodeProject(config, config => {
    config.modResults = mutateXcodeProjectWithAutoCodeSigningInfo({
      project: config.modResults,
      appleTeamId: teamId,
    })
    return config
  })
}

module.exports = withDevSigning
