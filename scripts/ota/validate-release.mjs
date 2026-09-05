#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

function fail(message) {
  throw new Error(message)
}
async function readJson(base, reference, label) {
  const resolved = await resolvePath(base, reference, label)
  return JSON.parse(await fs.readFile(resolved, 'utf8'))
}
async function resolvePath(base, reference, label) {
  if (typeof reference !== 'string' || path.isAbsolute(reference))
    fail(`${label} must be relative`)
  const lexicalRelative = path.relative(base, path.resolve(base, reference))
  if (lexicalRelative.startsWith('..') || path.isAbsolute(lexicalRelative))
    fail(`${label} escapes the release directory`)
  const realBase = await fs.realpath(base)
  const resolved = await fs.realpath(path.resolve(base, reference))
  const relative = path.relative(realBase, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative))
    fail(`${label} escapes the release directory`)
  return resolved
}
function validateFingerprintReport(report, expected, label) {
  if (
    report.schemaVersion !== 1 ||
    report.platform !== expected.platform ||
    report.nativeProfile !== expected.nativeProfile ||
    report.sourceCommit !== expected.sourceCommit ||
    report.runtimeVersion !== expected.runtimeVersion ||
    report.fingerprintPolicyVersion !== 1 ||
    typeof report.fingerprintToolVersion !== 'string' ||
    report.fingerprintToolVersion.length === 0 ||
    !report.toolVersions ||
    !['expo', 'expoUpdates', 'node', 'packageManager'].every(
      key =>
        typeof report.toolVersions[key] === 'string' &&
        report.toolVersions[key].length > 0,
    ) ||
    !Array.isArray(report.fingerprintSources) ||
    report.fingerprintSources.length === 0 ||
    report.fingerprintSources.some(
      source =>
        !source ||
        !['file', 'dir', 'contents'].includes(source.type) ||
        !Object.hasOwn(source, 'hash') ||
        (source.hash !== null && !/^[0-9a-f]{40}$/.test(source.hash)),
    )
  )
    fail(`${label} is incomplete or inconsistent`)
  if (
    !report.fingerprintSources.some(
      source =>
        source.type === 'contents' && source.id === 'expoConfig' && source.hash,
    )
  )
    fail(`${label} omits resolved Expo config`)
  if (
    !report.fingerprintSources.some(
      source =>
        source.type === 'file' &&
        source.filePath === 'scripts/ota/fingerprint-policy.json' &&
        source.hash,
    )
  )
    fail(`${label} omits the fingerprint policy`)
  const requiredPlatformSources =
    expected.platform === 'ios'
      ? [
          'modules/BlueskyClip',
          'modules/BlueskyNSE',
          'modules/Share-with-Bluesky',
        ]
      : ['google-services.json']
  for (const filePath of requiredPlatformSources) {
    if (
      !report.fingerprintSources.some(
        source => source.filePath === filePath && source.hash,
      )
    )
      fail(`${label} omits ${filePath}`)
  }
}
async function main() {
  const i = process.argv.indexOf('--release-file')
  if (i < 0 || !process.argv[i + 1]) fail('--release-file is required')
  const releasePath = path.resolve(process.argv[i + 1])
  const base = path.dirname(releasePath)
  const release = JSON.parse(await fs.readFile(releasePath, 'utf8'))
  if (
    release.schemaVersion !== 1 ||
    !/^[0-9a-f]{40}$/.test(release.sourceCommit ?? '')
  )
    fail('Invalid release sourceCommit')
  if (!/^[0-9]{13}$/.test(release.bundleVersion ?? ''))
    fail('bundleVersion must be a 13-digit Unix millisecond string')
  if (!['production', 'testflight'].includes(release.nativeProfile))
    fail('Invalid nativeProfile')
  if (!(
    release.channel === 'production' ||
    release.channel === 'testflight' ||
    /^pull-request-[1-9][0-9]*$/.test(release.channel ?? '')
  ))
    fail('Invalid channel')
  if (
    release.channel === 'production' &&
    release.nativeProfile !== 'production'
  )
    fail('Production channel requires the production native profile')
  if (
    release.channel !== 'production' &&
    release.nativeProfile !== 'testflight'
  )
    fail(`${release.channel} requires the testflight native profile`)
  if (!release.platforms || Object.keys(release.platforms).length === 0)
    fail('At least one platform is required')
  const verification = {schemaVersion: 1, valid: true, platforms: {}}
  for (const [platform, entry] of Object.entries(release.platforms)) {
    if (
      !['ios', 'android'].includes(platform) ||
      !/^[0-9a-f]{40}$/.test(entry.runtimeVersion ?? '')
    )
      fail(`Invalid ${platform} entry`)
    const report = await readJson(
      base,
      entry.fingerprintReportRef,
      `${platform} fingerprintReportRef`,
    )
    validateFingerprintReport(
      report,
      {
        platform,
        nativeProfile: release.nativeProfile,
        sourceCommit: release.sourceCommit,
        runtimeVersion: entry.runtimeVersion,
      },
      `${platform} export fingerprint report`,
    )
    await fs
      .stat(
        await resolvePath(
          base,
          entry.bundleDirectory,
          `${platform} bundleDirectory`,
        ),
      )
      .catch(() => fail(`${platform} bundleDirectory is missing`))
    if (release.channel === 'production') {
      if (!/^[0-9]+$/.test(entry.targetNativeBuildNumber ?? ''))
        fail(`Production ${platform} target is required`)
      if (entry.targetNativeBuildReceiptRef != null) {
        const receiptPath = await resolvePath(
          base,
          entry.targetNativeBuildReceiptRef,
          `${platform} receipt ref`,
        )
        const receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8'))
        const receiptReport = await readJson(
          path.dirname(receiptPath),
          receipt.fingerprintReportRef,
          `${platform} receipt report ref`,
        )
        if (
          receipt.schemaVersion !== 1 ||
          receipt.platform !== platform ||
          receipt.nativeProfile !== 'production' ||
          receipt.defaultChannel !== 'production' ||
          receipt.nativeBuildNumber !== entry.targetNativeBuildNumber ||
          receipt.runtimeVersion !== entry.runtimeVersion ||
          receipt.fingerprintPolicyVersion !== 1 ||
          typeof receipt.fingerprintToolVersion !== 'string' ||
          !/^[0-9a-f]{40}$/.test(receipt.sourceCommit ?? '') ||
          typeof receipt.appVersion !== 'string' ||
          receipt.appVersion.length === 0 ||
          typeof receipt.buildRunUrl !== 'string' ||
          receipt.buildRunUrl.length === 0 ||
          !/^[0-9a-f]{64}$/.test(receipt.artifactDigest ?? '')
        )
          fail(`Production ${platform} receipt is incompatible`)
        validateFingerprintReport(
          receiptReport,
          {
            platform,
            nativeProfile: 'production',
            sourceCommit: receipt.sourceCommit,
            runtimeVersion: receipt.runtimeVersion,
          },
          `Production ${platform} receipt fingerprint report`,
        )
        if (
          receiptReport.fingerprintToolVersion !==
          receipt.fingerprintToolVersion
        )
          fail(`Production ${platform} receipt tool version is inconsistent`)
        verification.platforms[platform] = {
          receiptVerification: {status: 'verified', reason: 'compatible'},
        }
      } else {
        console.error(
          `Warning: production ${platform} target could not be verified because no native build receipt was supplied`,
        )
        verification.platforms[platform] = {
          receiptVerification: {
            status: 'unverified',
            reason: 'receipt-unavailable',
          },
        }
      }
    } else if (
      entry.targetNativeBuildNumber != null ||
      entry.targetNativeBuildReceiptRef != null
    )
      fail(`${release.channel} must not target a native build`)
    else
      verification.platforms[platform] = {
        receiptVerification: {status: 'not-required', reason: 'channel-policy'},
      }
  }
  process.stdout.write(`${JSON.stringify(verification)}\n`)
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
