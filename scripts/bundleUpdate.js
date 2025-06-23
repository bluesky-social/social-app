const crypto = require('crypto')
const fs = require('fs')
const fsp = fs.promises
const path = require('path')

const DIST_DIR = './dist'
const BUNDLES_DIR = '/_expo/static/js'
const IOS_BUNDLE_DIR = path.join(DIST_DIR, BUNDLES_DIR, '/ios')
const ANDROID_BUNDLE_DIR = path.join(DIST_DIR, BUNDLES_DIR, '/android')
const METADATA_PATH = path.join(DIST_DIR, '/metadata.json')
const DEST_DIR = './bundleTempDir'

// Weird, don't feel like figuring out _why_ it wants this
const METADATA = require(`../${METADATA_PATH}`)
const IOS_METADATA_ASSETS = METADATA.fileMetadata.ios.assets
const ANDROID_METADATA_ASSETS = METADATA.fileMetadata.android.assets

const getMd5 = async path => {
  return new Promise(res => {
    const hash = crypto.createHash('md5')
    const rStream = fs.createReadStream(path)
    rStream.on('data', data => {
      hash.update(data)
    })
    rStream.on('end', () => {
      res(hash.digest('hex'))
    })
  })
}

const moveFiles = async () => {
  console.log('Making directory...')
  await fsp.mkdir(DEST_DIR)
  await fsp.mkdir(path.join(DEST_DIR, '/assets'))

  console.log('Getting ios md5...')
  const iosCurrPath = path.join(
    IOS_BUNDLE_DIR,
    (await fsp.readdir(IOS_BUNDLE_DIR))[0],
  )
  const iosMd5 = await getMd5(iosCurrPath)
  const iosNewPath = `bundles/${iosMd5}.bundle`

  console.log('Copying ios bundle...')
  await fsp.cp(iosCurrPath, path.join(DEST_DIR, iosNewPath))

  console.log('Getting android md5...')
  const androidCurrPath = path.join(
    ANDROID_BUNDLE_DIR,
    (await fsp.readdir(ANDROID_BUNDLE_DIR))[0],
  )
  const androidMd5 = await getMd5(androidCurrPath)
  const androidNewPath = `bundles/${androidMd5}.bundle`

  console.log('Copying android bundle...')
  await fsp.cp(androidCurrPath, path.join(DEST_DIR, androidNewPath))

  const iosAssets = []
  const androidAssets = []

  console.log('Getting ios asset md5s and moving them...')
  for (const asset of IOS_METADATA_ASSETS) {
    const currPath = path.join(DIST_DIR, asset.path)
    const md5 = await getMd5(currPath)
    const withExtPath = `assets/${md5}.${asset.ext}`
    iosAssets.push(withExtPath)
    await fsp.cp(currPath, path.join(DEST_DIR, withExtPath))
  }

  console.log('Getting android asset md5s and moving them...')
  for (const asset of ANDROID_METADATA_ASSETS) {
    const currPath = path.join(DIST_DIR, asset.path)
    const md5 = await getMd5(currPath)
    const withExtPath = `assets/${md5}.${asset.ext}`
    androidAssets.push(withExtPath)
    await fsp.cp(currPath, path.join(DEST_DIR, withExtPath))
  }

  const result = {
    version: 0,
    bundler: 'metro',
    fileMetadata: {
      ios: {
        bundle: iosNewPath,
        assets: iosAssets,
      },
      android: {
        bundle: androidNewPath,
        assets: androidAssets,
      },
    },
  }

  console.log('Writing metadata...')
  await fsp.writeFile(
    path.join(DEST_DIR, 'metadata.json'),
    JSON.stringify(result),
  )

  console.log('Finished!')
  console.log('Metadata:', result)
}

moveFiles()
