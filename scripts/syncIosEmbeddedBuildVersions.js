#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const {execFileSync} = require('child_process')

if (
  process.env.EAS_BUILD_PLATFORM &&
  process.env.EAS_BUILD_PLATFORM !== 'ios'
) {
  process.exit(0)
}

const root = path.resolve(__dirname, '..')
const iosDir = path.join(root, 'ios')
const appInfoPlist = path.join(iosDir, 'Blacksky', 'Info.plist')
const projectFile = path.join(iosDir, 'Blacksky.xcodeproj', 'project.pbxproj')

const targetInfoPlists = [
  path.join(iosDir, 'BlackskyClip', 'Info.plist'),
  path.join(iosDir, 'BlackskyNSE', 'Info.plist'),
  path.join(iosDir, 'Share-with-Blacksky', 'Info.plist'),
]

function readPlistValue(plist, key) {
  try {
    return execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', `Print :${key}`, plist],
      {
        encoding: 'utf8',
      },
    ).trim()
  } catch {
    return undefined
  }
}

function setPlistValue(plist, key, value) {
  try {
    execFileSync('/usr/libexec/PlistBuddy', [
      '-c',
      `Set :${key} ${value}`,
      plist,
    ])
  } catch {
    execFileSync('/usr/libexec/PlistBuddy', [
      '-c',
      `Add :${key} string ${value}`,
      plist,
    ])
  }
}

const rawBuildNumber =
  process.env.BSKY_IOS_BUILD_NUMBER ??
  readPlistValue(appInfoPlist, 'CFBundleVersion')

if (!rawBuildNumber || rawBuildNumber.includes('$(')) {
  throw new Error(
    `Unable to resolve iOS build number from BSKY_IOS_BUILD_NUMBER or ${appInfoPlist}`,
  )
}

const buildNumber = rawBuildNumber.replace(/"/g, '')

let project = fs.readFileSync(projectFile, 'utf8')
project = project.replace(
  /CURRENT_PROJECT_VERSION = (?:"[^"]*"|[^;]+);/g,
  `CURRENT_PROJECT_VERSION = ${buildNumber};`,
)
fs.writeFileSync(projectFile, project)

for (const plist of targetInfoPlists) {
  if (fs.existsSync(plist)) {
    setPlistValue(plist, 'CFBundleVersion', '$(CURRENT_PROJECT_VERSION)')
  }
}

console.log(`Synced iOS embedded target build versions to ${buildNumber}`)
