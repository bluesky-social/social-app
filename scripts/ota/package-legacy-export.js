#!/usr/bin/env node
/* oxlint-disable import/no-nodejs-modules -- This is a Node-only build script. */
const crypto = require('crypto')
const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const source = path.resolve('dist')
const destination = path.resolve('bundleTempDir')
async function hash(file) {
  const value = crypto.createHash('md5')
  for await (const chunk of fs.createReadStream(file)) value.update(chunk)
  return value.digest('hex')
}
async function main() {
  /** @type {{fileMetadata: Record<string, {bundle: string, assets?: {path: string, ext: string}[]}>}} */
  const metadata = JSON.parse(
    await fsp.readFile(path.join(source, 'metadata.json'), 'utf8'),
  )
  await fsp.mkdir(path.join(destination, 'bundles'), {recursive: true})
  await fsp.mkdir(path.join(destination, 'assets'), {recursive: true})
  const result = {version: 0, bundler: 'metro', fileMetadata: {}}
  for (const platform of ['ios', 'android']) {
    const input = metadata.fileMetadata?.[platform]
    if (!input?.bundle)
      throw new Error(
        `Missing explicit ${platform} bundle in dist/metadata.json`,
      )
    const bundleSource = path.resolve(source, input.bundle)
    const bundle = `bundles/${await hash(bundleSource)}.bundle`
    await fsp.copyFile(bundleSource, path.join(destination, bundle))
    const assets = []
    for (const asset of input.assets ?? []) {
      const assetSource = path.resolve(source, asset.path)
      const target = `assets/${await hash(assetSource)}.${asset.ext}`
      await fsp.copyFile(assetSource, path.join(destination, target))
      assets.push(target)
    }
    result.fileMetadata[platform] = {bundle, assets}
  }
  await fsp.writeFile(
    path.join(destination, 'metadata.json'),
    JSON.stringify(result),
  )
}
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
