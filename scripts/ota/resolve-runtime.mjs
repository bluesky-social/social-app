#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {execFileSync} from 'node:child_process'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '../..')

function fail(message) {
  throw new Error(message)
}

function parseArgs(argv) {
  const result = {}
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key?.startsWith('--') || value == null)
      fail(`Invalid argument: ${key}`)
    result[key.slice(2)] = value
  }
  return result
}

async function assertFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  const stat = await fs.stat(absolutePath).catch(() => null)
  if (!stat?.isFile())
    fail(`Required fingerprint input is missing: ${relativePath}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const platform = args.platform
  const nativeProfile = args.profile
  if (!['ios', 'android'].includes(platform))
    fail('--platform must be ios or android')
  if (!['production', 'testflight'].includes(nativeProfile)) {
    fail('--profile must be production or testflight')
  }

  if (
    process.env.EAS_BUILD_PLATFORM &&
    process.env.EAS_BUILD_PLATFORM !== platform
  ) {
    fail(
      `EAS_BUILD_PLATFORM=${process.env.EAS_BUILD_PLATFORM} conflicts with ${platform}`,
    )
  }
  if (
    process.env.EXPO_PUBLIC_ENV &&
    process.env.EXPO_PUBLIC_ENV !== nativeProfile
  ) {
    fail(
      `EXPO_PUBLIC_ENV=${process.env.EXPO_PUBLIC_ENV} conflicts with ${nativeProfile}`,
    )
  }
  process.env.EAS_BUILD_PLATFORM = platform
  process.env.EXPO_PUBLIC_ENV = nativeProfile
  process.env.OTA_FINGERPRINT_PIPELINE_ENABLED = '1'

  const sourceCommit = args['source-commit'] ?? process.env.GITHUB_SHA
  if (!/^[0-9a-f]{40}$/.test(sourceCommit ?? ''))
    fail('--source-commit or GITHUB_SHA must be a full lowercase SHA')
  const checkoutCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim()
  if (sourceCommit !== checkoutCommit)
    fail(
      `sourceCommit ${sourceCommit} does not match checkout HEAD ${checkoutCommit}`,
    )

  for (const file of [
    'app.config.js',
    'fingerprint.config.js',
    'scripts/ota/fingerprint-policy.json',
    ...(platform === 'android' ? ['google-services.json'] : []),
  ])
    await assertFile(file)
  if (platform === 'ios') {
    for (const name of ['BlueskyClip', 'BlueskyNSE', 'Share-with-Bluesky']) {
      const stat = await fs
        .stat(path.join(root, 'modules', name))
        .catch(() => null)
      if (!stat?.isDirectory())
        fail(`Required native extension is missing: modules/${name}`)
    }
  }

  delete require.cache[
    require.resolve(path.join(root, 'fingerprint.config.js'))
  ]
  const fingerprintConfig = require(path.join(root, 'fingerprint.config.js'))
  if (
    fingerprintConfig.hashAlgorithm !== 'sha1' ||
    !Array.isArray(fingerprintConfig.extraSources)
  ) {
    fail('fingerprint.config.js did not load the canonical policy')
  }
  const {getConfig} = require('expo/config')
  const {exp} = getConfig(root, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  })
  if (exp.runtimeVersion?.policy !== 'fingerprint')
    fail('Expo runtimeVersion policy must be fingerprint')

  const {
    resolveRuntimeVersionAsync,
  } = require('expo-updates/utils/build/resolveRuntimeVersionAsync')
  const resolved = await resolveRuntimeVersionAsync(
    root,
    platform,
    {silent: true},
    {workflowOverride: 'managed'},
  )
  if (!/^[0-9a-f]{40}$/.test(resolved.runtimeVersion ?? ''))
    fail('Resolver returned an invalid fingerprint runtime')
  if (
    !Array.isArray(resolved.fingerprintSources) ||
    resolved.fingerprintSources.length === 0
  ) {
    fail('Resolver returned no fingerprint sources')
  }
  const policySource = resolved.fingerprintSources.find(
    source =>
      source.type === 'file' &&
      source.filePath?.endsWith('fingerprint-policy.json'),
  )
  if (!policySource?.hash)
    fail('Fingerprint report omitted the compatibility policy source')
  const expoConfigSource = resolved.fingerprintSources.find(
    source => source.type === 'contents' && source.id === 'expoConfig',
  )
  if (!expoConfigSource?.hash)
    fail('Fingerprint report omitted resolved Expo config')
  if (platform === 'ios') {
    for (const name of ['BlueskyClip', 'BlueskyNSE', 'Share-with-Bluesky']) {
      const source = resolved.fingerprintSources.find(
        candidate =>
          candidate.type === 'dir' && candidate.filePath === `modules/${name}`,
      )
      if (!source?.hash) fail(`Fingerprint report omitted modules/${name}`)
    }
  } else {
    const googleServicesSource = resolved.fingerprintSources.find(
      source =>
        source.type === 'file' && source.filePath === 'google-services.json',
    )
    if (!googleServicesSource?.hash)
      fail('Fingerprint report omitted google-services.json')
  }

  const projectPackage = require(path.join(root, 'package.json'))
  const packageManager =
    projectPackage.packageManager ??
    `${projectPackage.devEngines.packageManager.name}@${projectPackage.devEngines.packageManager.version}`
  const report = {
    schemaVersion: 1,
    platform,
    nativeProfile,
    sourceCommit,
    runtimeVersion: resolved.runtimeVersion,
    fingerprintPolicyVersion: 1,
    fingerprintToolVersion: require('@expo/fingerprint/package.json').version,
    toolVersions: {
      expo: require('expo/package.json').version,
      expoUpdates: require('expo-updates/package.json').version,
      node: process.version,
      packageManager,
    },
    fingerprintSources: resolved.fingerprintSources,
  }
  const json = `${JSON.stringify(report, null, 2)}\n`
  if (args.output) {
    await fs.mkdir(path.dirname(path.resolve(args.output)), {recursive: true})
    await fs.writeFile(path.resolve(args.output), json)
  } else {
    process.stdout.write(json)
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
