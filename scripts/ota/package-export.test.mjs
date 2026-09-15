import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '../..')
const packager = path.join(root, 'scripts/bundleUpdate.js')
const publisher = path.join(root, 'scripts/denisPublish.sh')
const sourceCommit = 'a'.repeat(40)

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`)
}

function report(platform, runtime) {
  return {
    schemaVersion: 1,
    platform,
    nativeProfile: 'testflight',
    sourceCommit,
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
      {type: 'contents', id: 'expoConfig', hash: 'b'.repeat(40)},
      {
        type: 'file',
        filePath: 'scripts/ota/fingerprint-policy.json',
        hash: 'c'.repeat(40),
      },
      ...(platform === 'ios'
        ? ['BlueskyClip', 'BlueskyNSE', 'Share-with-Bluesky'].map(name => ({
            type: 'dir',
            filePath: `modules/${name}`,
            hash: 'd'.repeat(40),
          }))
        : [
            {
              type: 'file',
              filePath: 'google-services.json',
              hash: 'e'.repeat(40),
            },
          ]),
    ],
  }
}

function fixture(platforms = ['ios', 'android']) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ota-package-'))
  const release = {
    schemaVersion: 1,
    sourceCommit,
    channel: 'testflight',
    nativeProfile: 'testflight',
    bundleVersion: '1788537600000',
    platforms: {},
  }
  for (const platform of platforms) {
    const runtime = platform === 'ios' ? '1'.repeat(40) : '2'.repeat(40)
    const exportDirectory = path.join(directory, `export-${platform}`)
    fs.mkdirSync(path.join(exportDirectory, 'bundles'), {recursive: true})
    fs.mkdirSync(path.join(exportDirectory, 'assets'), {recursive: true})
    fs.writeFileSync(path.join(exportDirectory, 'bundles/00-decoy.js'), 'decoy')
    fs.writeFileSync(
      path.join(exportDirectory, 'bundles/chosen.js'),
      `${platform}-chosen`,
    )
    fs.writeFileSync(
      path.join(exportDirectory, 'assets/icon.png'),
      `${platform}-asset`,
    )
    writeJson(path.join(exportDirectory, 'metadata.json'), {
      version: 0,
      bundler: 'metro',
      fileMetadata: {
        [platform]: {
          bundle: 'bundles/chosen.js',
          assets: [{path: 'assets/icon.png', ext: 'png'}],
        },
      },
    })
    writeJson(
      path.join(directory, `${platform}-report.json`),
      report(platform, runtime),
    )
    release.platforms[platform] = {
      runtimeVersion: runtime,
      fingerprintReportRef: `${platform}-report.json`,
      bundleDirectory: `export-${platform}`,
    }
  }
  const releaseFile = path.join(directory, 'ota-export.json')
  writeJson(releaseFile, release)
  return {directory, releaseFile}
}

function packageRelease(releaseFile) {
  const result = spawnSync(
    process.execPath,
    [packager, '--release-file', releaseFile],
    {
      encoding: 'utf8',
    },
  )
  if (result.status !== 0) throw new Error(result.stderr.trim())
  return result.stdout.trim()
}

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex')
}

test('packages the metadata-referenced bundles per platform without mutating input', () => {
  const value = fixture()
  const before = fs.readFileSync(value.releaseFile, 'utf8')
  const packagedFile = packageRelease(value.releaseFile)
  const packaged = JSON.parse(fs.readFileSync(packagedFile))
  assert.equal(fs.readFileSync(value.releaseFile, 'utf8'), before)
  for (const platform of ['ios', 'android']) {
    const bundleDirectory = path.resolve(
      value.directory,
      packaged.platforms[platform].bundleDirectory,
    )
    assert.equal(
      fs.readFileSync(
        path.join(
          bundleDirectory,
          `bundles/${md5(`${platform}-chosen`)}.bundle`,
        ),
        'utf8',
      ),
      `${platform}-chosen`,
    )
    assert.equal(
      path.resolve(
        path.dirname(packagedFile),
        packaged.platforms[platform].fingerprintReportRef,
      ),
      path.join(value.directory, `${platform}-report.json`),
    )
  }
  const retry = packageRelease(value.releaseFile)
  assert.notEqual(retry, packagedFile)
  assert.equal(fs.readFileSync(value.releaseFile, 'utf8'), before)
})

test('preserves a rollback marker', () => {
  const value = fixture(['ios'])
  fs.writeFileSync(
    path.join(value.directory, 'export-ios/rollback'),
    'rollback\n',
  )
  const packaged = JSON.parse(
    fs.readFileSync(packageRelease(value.releaseFile)),
  )
  assert.equal(
    fs.readFileSync(
      path.resolve(
        value.directory,
        packaged.platforms.ios.bundleDirectory,
        'rollback',
      ),
      'utf8',
    ),
    'rollback\n',
  )
})

test('rejects malformed metadata and path, symlink, and extension escapes', () => {
  const mutations = {
    'malformed metadata': value =>
      fs.writeFileSync(
        path.join(value.directory, 'export-ios/metadata.json'),
        '{',
      ),
    'bundle escape': value => {
      const metadata = JSON.parse(
        fs.readFileSync(path.join(value.directory, 'export-ios/metadata.json')),
      )
      metadata.fileMetadata.ios.bundle = '../outside.js'
      fs.writeFileSync(path.join(value.directory, 'outside.js'), 'outside')
      writeJson(
        path.join(value.directory, 'export-ios/metadata.json'),
        metadata,
      )
    },
    'bundle symlink': value => {
      fs.rmSync(path.join(value.directory, 'export-ios/bundles/chosen.js'))
      fs.writeFileSync(path.join(value.directory, 'outside.js'), 'outside')
      fs.symlinkSync(
        path.join(value.directory, 'outside.js'),
        path.join(value.directory, 'export-ios/bundles/chosen.js'),
      )
    },
    'asset escape': value => {
      const metadata = JSON.parse(
        fs.readFileSync(path.join(value.directory, 'export-ios/metadata.json')),
      )
      metadata.fileMetadata.ios.assets[0].path = '../outside.png'
      fs.writeFileSync(path.join(value.directory, 'outside.png'), 'outside')
      writeJson(
        path.join(value.directory, 'export-ios/metadata.json'),
        metadata,
      )
    },
    'asset symlink': value => {
      fs.rmSync(path.join(value.directory, 'export-ios/assets/icon.png'))
      fs.writeFileSync(path.join(value.directory, 'outside.png'), 'outside')
      fs.symlinkSync(
        path.join(value.directory, 'outside.png'),
        path.join(value.directory, 'export-ios/assets/icon.png'),
      )
    },
    'extension escape': value => {
      const metadata = JSON.parse(
        fs.readFileSync(path.join(value.directory, 'export-ios/metadata.json')),
      )
      metadata.fileMetadata.ios.assets[0].ext = '../js'
      writeJson(
        path.join(value.directory, 'export-ios/metadata.json'),
        metadata,
      )
    },
  }
  for (const [name, mutate] of Object.entries(mutations)) {
    const value = fixture(['ios'])
    mutate(value)
    assert.throws(() => packageRelease(value.releaseFile), undefined, name)
  }
})

test('structured wrapper validates and invokes only release-file publishing', () => {
  const value = fixture(['ios'])
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-denis-'))
  const log = path.join(bin, 'args.json')
  const denis = path.join(bin, 'denis')
  fs.writeFileSync(
    denis,
    '#!/bin/sh\nprintf "%s\\n" "$@" > "$DENIS_TEST_LOG"\n',
    {mode: 0o755},
  )
  const result = spawnSync('bash', [publisher, value.releaseFile], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      DENIS_TEST_LOG: log,
      DENIS_PUBLISH_MODE: 'structured',
    },
  })
  assert.equal(result.status, 0, result.stderr)
  const args = fs.readFileSync(log, 'utf8').trim().split('\n')
  assert.deepEqual(args.slice(0, 2), ['publish', '--release-file'])
  assert.notEqual(args[2], value.releaseFile)
  assert.ok(fs.existsSync(args[2]))
})

test('wrapper defaults existing callers to legacy mode', () => {
  const result = spawnSync('bash', [publisher], {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, DENIS_PUBLISH_MODE: ''},
  })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /CHANNEL_NAME is required/)
})
