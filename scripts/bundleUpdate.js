#!/usr/bin/env node
/* oxlint-disable import/no-nodejs-modules -- This is a Node-only build script. */
const crypto = require('crypto')
const fs = require('fs')
const fsp = fs.promises
const path = require('path')

/** @param {string[]} argv */
function args(argv) {
  /** @type {Record<string, string>} */
  const out = {}
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || argv[i + 1] == null)
      throw new Error(`Invalid argument: ${argv[i]}`)
    out[argv[i].slice(2)] = argv[i + 1]
  }
  return out
}
async function digest(file) {
  const hash = crypto.createHash('md5')
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}
async function childOf(parent, child) {
  const relative = path.relative(
    await fsp.realpath(parent),
    await fsp.realpath(child),
  )
  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  )
}

/**
 * @param {string} platform
 * @param {string} sourceDir
 * @param {string} destinationDir
 */
async function packagePlatform(platform, sourceDir, destinationDir) {
  const metadataPath = path.join(sourceDir, 'metadata.json')
  if (!(await childOf(sourceDir, metadataPath)))
    throw new Error('Metadata escapes export directory')
  /** @type {{fileMetadata?: Record<string, {bundle: string, assets?: {path: string, ext: string}[]}>}} */
  const metadata = JSON.parse(await fsp.readFile(metadataPath, 'utf8'))
  const input = metadata.fileMetadata?.[platform]
  if (!input || typeof input.bundle !== 'string')
    throw new Error(`${metadataPath} has no explicit ${platform} bundle`)
  const outputDir = path.join(destinationDir, platform)
  await fsp.mkdir(path.join(outputDir, 'bundles'), {recursive: true})
  await fsp.mkdir(path.join(outputDir, 'assets'), {recursive: true})
  const bundleSource = path.resolve(sourceDir, input.bundle)
  if (!(await childOf(sourceDir, bundleSource)))
    throw new Error(`Bundle escapes export directory: ${input.bundle}`)
  const bundle = `bundles/${await digest(bundleSource)}.bundle`
  await fsp.copyFile(bundleSource, path.join(outputDir, bundle))
  const assets = []
  for (const asset of input.assets ?? []) {
    if (
      typeof asset.path !== 'string' ||
      typeof asset.ext !== 'string' ||
      !/^[a-zA-Z0-9]+$/.test(asset.ext)
    )
      throw new Error(`Invalid ${platform} asset metadata`)
    const source = path.resolve(sourceDir, asset.path)
    if (!(await childOf(sourceDir, source)))
      throw new Error(`Asset escapes export directory: ${asset.path}`)
    const target = `assets/${await digest(source)}.${asset.ext}`
    await fsp.copyFile(source, path.join(outputDir, target))
    assets.push(target)
  }
  await fsp.writeFile(
    path.join(outputDir, 'metadata.json'),
    `${JSON.stringify({version: 0, bundler: 'metro', fileMetadata: {[platform]: {bundle, assets}}})}\n`,
  )
  const rollbackPath = path.join(sourceDir, 'rollback')
  if (fs.existsSync(rollbackPath)) {
    if (!(await childOf(sourceDir, rollbackPath)))
      throw new Error('Rollback marker escapes export directory')
    await fsp.copyFile(rollbackPath, path.join(outputDir, 'rollback'))
  }
}

async function main() {
  const options = args(process.argv.slice(2))
  if (!options['release-file']) throw new Error('--release-file is required')
  const releasePath = path.resolve(options['release-file'])
  const base = path.dirname(releasePath)
  /** @type {{schemaVersion: number, bundleVersion: string, platforms: Record<string, {bundleDirectory: string}>}} */
  const release = JSON.parse(await fsp.readFile(releasePath, 'utf8'))
  if (
    release.schemaVersion !== 1 ||
    !release.platforms ||
    !/^[0-9]{13}$/.test(release.bundleVersion ?? '')
  )
    throw new Error('Invalid OTA export schema')
  const outputDir = options['output-dir']
    ? path.resolve(options['output-dir'])
    : await fsp.mkdtemp(path.join(base, 'ota-bundles-'))
  const outputRelative = path.relative(base, outputDir)
  if (
    !outputRelative ||
    outputRelative.startsWith('..') ||
    path.isAbsolute(outputRelative)
  )
    throw new Error('Packaged output must be inside the release directory')
  if (options['output-dir']) await fsp.mkdir(outputDir, {recursive: false})
  for (const [platform, entry] of Object.entries(release.platforms)) {
    if (
      !['ios', 'android'].includes(platform) ||
      typeof entry.bundleDirectory !== 'string'
    )
      throw new Error(`Invalid platform entry: ${platform}`)
    const sourceDir = path.resolve(base, entry.bundleDirectory)
    if (sourceDir !== base && !(await childOf(base, sourceDir)))
      throw new Error('Export directory escapes release directory')
    await packagePlatform(platform, sourceDir, outputDir)
    entry.bundleDirectory = path.relative(base, path.join(outputDir, platform))
  }
  const packagedReleasePath = `${outputDir}.json`
  await fsp.writeFile(
    packagedReleasePath,
    `${JSON.stringify(release, null, 2)}\n`,
    {flag: 'wx'},
  )
  process.stdout.write(`${packagedReleasePath}\n`)
}
main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
