#!/usr/bin/env node

import fs from 'node:fs'

const REQUEST_HEADERS_KEY =
  'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY'
const RUNTIME_VERSION_KEY = 'expo.modules.updates.EXPO_RUNTIME_VERSION'

function fail(message) {
  throw new Error(message)
}

function decodeXml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

export function parsePackagedAndroidConfig(manifestXml, runtimeResources) {
  const metadataTags = [...manifestXml.matchAll(/<meta-data\b[^>]*>/g)].map(
    match => match[0],
  )
  const tagsNamed = requestedName =>
    metadataTags.filter(tag => {
      const name = tag.match(/android:name="([^"]+)"/)?.[1]
      return decodeXml(name ?? '') === requestedName
    })
  const matchingTags = tagsNamed(REQUEST_HEADERS_KEY)
  if (matchingTags.length !== 1) {
    fail(`Expected exactly one ${REQUEST_HEADERS_KEY} manifest entry`)
  }
  const encodedHeaders = matchingTags[0].match(/android:value="([^"]*)"/)?.[1]
  if (encodedHeaders == null) fail('Update request headers have no value')

  let headers
  try {
    headers = JSON.parse(decodeXml(encodedHeaders))
  } catch {
    fail('Update request headers are not valid JSON')
  }
  if (
    !headers ||
    typeof headers !== 'object' ||
    Array.isArray(headers) ||
    typeof headers['expo-channel-name'] !== 'string' ||
    !headers['expo-channel-name']
  ) {
    fail('Update request headers omit expo-channel-name')
  }

  const runtimeTags = tagsNamed(RUNTIME_VERSION_KEY)
  if (runtimeTags.length !== 1) {
    fail(`Expected exactly one ${RUNTIME_VERSION_KEY} manifest entry`)
  }
  const runtimeManifestValue = decodeXml(
    runtimeTags[0].match(/android:value="([^"]*)"/)?.[1] ?? '',
  )
  const resourceIDs = [
    ...runtimeResources.matchAll(
      /^\s*(0x[0-9a-f]+)\s+-\s+string\/expo_runtime_version\s*$/gim,
    ),
  ].map(match => match[1].toLowerCase())
  if (
    runtimeManifestValue === '@string/expo_runtime_version' ||
    /^@ref\/0x[0-9a-f]+$/i.test(runtimeManifestValue)
  ) {
    if (resourceIDs.length !== 1) {
      fail('Expected exactly one string/expo_runtime_version resource ID')
    }
    if (
      runtimeManifestValue.startsWith('@ref/') &&
      runtimeManifestValue.slice('@ref/'.length).toLowerCase() !==
        resourceIDs[0]
    ) {
      fail('Runtime manifest reference does not identify expo_runtime_version')
    }
    const values = [
      ...runtimeResources.matchAll(
        /(?:\[STR\]|value:)\s*(?:\([^)]*\)\s*)?["']([^"']+)["']/gi,
      ),
    ].map(match => match[1])
    if (values.length === 0) {
      fail('Could not parse string/expo_runtime_version value')
    }
    if (values.some(value => value !== 'file:fingerprint')) {
      fail('Packaged Expo runtime resource is not file:fingerprint')
    }
  } else if (runtimeManifestValue !== 'file:fingerprint') {
    fail('Packaged Expo runtime is not file:fingerprint')
  }

  return {
    channel: headers['expo-channel-name'],
    runtimeConfiguration: 'file:fingerprint',
  }
}

function main() {
  const [manifestPath, resourcesPath] = process.argv.slice(2)
  if (!manifestPath || !resourcesPath) {
    fail('Usage: native-receipt-android.mjs <manifest.xml> <resources.txt>')
  }
  const result = parsePackagedAndroidConfig(
    fs.readFileSync(manifestPath, 'utf8'),
    fs.readFileSync(resourcesPath, 'utf8'),
  )
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], 'file:').href
) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
