import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const validator = path.resolve(import.meta.dirname, 'validate-release.mjs')
const sha = 'a'.repeat(40)
const runtime = 'b'.repeat(40)

function fixture(channel = 'production') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ota-release-'))
  fs.mkdirSync(path.join(directory, 'bundle'))
  fs.writeFileSync(
    path.join(directory, 'report.json'),
    JSON.stringify({
      schemaVersion: 1,
      platform: 'ios',
      nativeProfile: 'production',
      sourceCommit: sha,
      runtimeVersion: runtime,
      fingerprintPolicyVersion: 1,
      fingerprintToolVersion: '0.20.8',
      toolVersions: {
        expo: '57.0.8',
        expoUpdates: '57.0.10',
        node: 'v24.19.0',
        packageManager: 'pnpm@11.21.0',
      },
      fingerprintSources: [
        {type: 'contents', id: 'expoConfig', hash: 'c'.repeat(40)},
        {
          type: 'file',
          filePath: 'scripts/ota/fingerprint-policy.json',
          hash: 'd'.repeat(40),
        },
        ...['BlueskyClip', 'BlueskyNSE', 'Share-with-Bluesky'].map(name => ({
          type: 'dir',
          filePath: `modules/${name}`,
          hash: 'e'.repeat(40),
        })),
      ],
    }),
  )
  const release = {
    schemaVersion: 1,
    sourceCommit: sha,
    channel,
    nativeProfile: 'production',
    bundleVersion: '1788537600000',
    platforms: {
      ios: {
        runtimeVersion: runtime,
        fingerprintReportRef: 'report.json',
        bundleDirectory: 'bundle',
        ...(channel === 'production' ? {targetNativeBuildNumber: '42'} : {}),
      },
    },
  }
  const releaseFile = path.join(directory, 'ota-export.json')
  fs.writeFileSync(releaseFile, JSON.stringify(release))
  return {directory, release, releaseFile}
}

function validate(releaseFile) {
  return execFileSync(
    process.execPath,
    [validator, '--release-file', releaseFile],
    {
      encoding: 'utf8',
    },
  )
}

test('production requires an exact build but permits an unavailable receipt', () => {
  const value = fixture()
  const result = JSON.parse(validate(value.releaseFile))
  assert.deepEqual(result.platforms.ios.receiptVerification, {
    status: 'unverified',
    reason: 'receipt-unavailable',
  })
  delete value.release.platforms.ios.targetNativeBuildNumber
  fs.writeFileSync(value.releaseFile, JSON.stringify(value.release))
  assert.throws(
    () => validate(value.releaseFile),
    /Production ios target is required/,
  )
})

test('testflight rejects build targeting', () => {
  const value = fixture('testflight')
  value.release.nativeProfile = 'testflight'
  value.release.platforms.ios.targetNativeBuildNumber = '42'
  const report = JSON.parse(
    fs.readFileSync(path.join(value.directory, 'report.json')),
  )
  report.nativeProfile = 'testflight'
  fs.writeFileSync(
    path.join(value.directory, 'report.json'),
    JSON.stringify(report),
  )
  fs.writeFileSync(value.releaseFile, JSON.stringify(value.release))
  assert.throws(
    () => validate(value.releaseFile),
    /must not target a native build/,
  )
})

test('a supplied receipt with an invalid source SHA fails closed', () => {
  const value = fixture()
  fs.mkdirSync(path.join(value.directory, 'receipts'))
  value.release.platforms.ios.targetNativeBuildReceiptRef =
    'receipts/receipt.json'
  fs.writeFileSync(
    path.join(value.directory, 'receipts/receipt.json'),
    JSON.stringify({
      schemaVersion: 1,
      platform: 'ios',
      nativeProfile: 'production',
      defaultChannel: 'production',
      appVersion: '1.133.0',
      nativeBuildNumber: '42',
      runtimeVersion: runtime,
      sourceCommit: 'short',
      fingerprintPolicyVersion: 1,
      fingerprintToolVersion: '0.20.8',
      artifactDigest: 'c'.repeat(64),
      buildRunUrl: 'https://github.example/build/1',
      fingerprintReportRef: 'report.json',
    }),
  )
  fs.writeFileSync(path.join(value.directory, 'receipts/report.json'), '{}')
  fs.writeFileSync(value.releaseFile, JSON.stringify(value.release))
  assert.throws(() => validate(value.releaseFile), /receipt is incompatible/)
})

test('bundle directories cannot escape the release directory', () => {
  const value = fixture('testflight')
  value.release.nativeProfile = 'testflight'
  value.release.platforms.ios.bundleDirectory = '../bundle'
  const report = JSON.parse(
    fs.readFileSync(path.join(value.directory, 'report.json')),
  )
  report.nativeProfile = 'testflight'
  fs.writeFileSync(
    path.join(value.directory, 'report.json'),
    JSON.stringify(report),
  )
  fs.writeFileSync(value.releaseFile, JSON.stringify(value.release))
  assert.throws(
    () => validate(value.releaseFile),
    /escapes the release directory/,
  )
})

test('channel and native profile must agree', () => {
  const value = fixture('testflight')
  assert.throws(
    () => validate(value.releaseFile),
    /requires the testflight native profile/,
  )
})

test('incomplete fingerprint reports are rejected', () => {
  const value = fixture()
  const report = JSON.parse(
    fs.readFileSync(path.join(value.directory, 'report.json')),
  )
  delete report.fingerprintToolVersion
  fs.writeFileSync(
    path.join(value.directory, 'report.json'),
    JSON.stringify(report),
  )
  assert.throws(
    () => validate(value.releaseFile),
    /fingerprint report is incomplete or inconsistent/,
  )
})

test('symlinked bundle directories cannot escape the release directory', () => {
  const value = fixture()
  fs.rmSync(path.join(value.directory, 'bundle'), {recursive: true})
  fs.symlinkSync(os.tmpdir(), path.join(value.directory, 'bundle'))
  assert.throws(
    () => validate(value.releaseFile),
    /escapes the release directory/,
  )
})
