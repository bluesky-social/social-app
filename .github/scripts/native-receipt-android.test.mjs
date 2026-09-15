import assert from 'node:assert/strict'
import test from 'node:test'

import {parsePackagedAndroidConfig} from './native-receipt-android.mjs'

const manifest = (headers, runtime = '@string/expo_runtime_version') => `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <meta-data android:name="expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY" android:value="${headers}" />
    <meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="${runtime}" />
  </application>
</manifest>`

const resources = value => `
Package 'xyz.blueskyweb.app'
0x7f1200aa - string/expo_runtime_version
  config (default): [STR] "${value}"
`

test('extracts the exact EAS channel and fingerprint sentinel', () => {
  assert.deepEqual(
    parsePackagedAndroidConfig(
      manifest('{&quot;expo-channel-name&quot;:&quot;testflight&quot;}'),
      resources('file:fingerprint'),
    ),
    {channel: 'testflight', runtimeConfiguration: 'file:fingerprint'},
  )
})

test('rejects an ambiguous request-header entry', () => {
  const entry = manifest(
    '{&quot;expo-channel-name&quot;:&quot;production&quot;}',
  )
  assert.throws(
    () =>
      parsePackagedAndroidConfig(entry + entry, resources('file:fingerprint')),
    /exactly one/,
  )
})

test('rejects a literal runtime even when a fingerprint asset exists', () => {
  assert.throws(
    () =>
      parsePackagedAndroidConfig(
        manifest('{&quot;expo-channel-name&quot;:&quot;production&quot;}'),
        resources('1.2.3'),
      ),
    /not file:fingerprint/,
  )
})

test('accepts a manifest with a direct fingerprint sentinel', () => {
  assert.deepEqual(
    parsePackagedAndroidConfig(
      manifest(
        '{&quot;expo-channel-name&quot;:&quot;production&quot;}',
        'file:fingerprint',
      ),
      '',
    ),
    {channel: 'production', runtimeConfiguration: 'file:fingerprint'},
  )
})

test('binds a compiled runtime reference to the named resource ID', () => {
  assert.deepEqual(
    parsePackagedAndroidConfig(
      manifest(
        '{&quot;expo-channel-name&quot;:&quot;testflight&quot;}',
        '@ref/0x7f1200aa',
      ),
      resources('file:fingerprint'),
    ),
    {channel: 'testflight', runtimeConfiguration: 'file:fingerprint'},
  )
})

test('rejects a compiled reference to a different resource ID', () => {
  assert.throws(
    () =>
      parsePackagedAndroidConfig(
        manifest(
          '{&quot;expo-channel-name&quot;:&quot;testflight&quot;}',
          '@ref/0x7f1300d8',
        ),
        resources('file:fingerprint'),
      ),
    /does not identify expo_runtime_version/,
  )
})

test('rejects an ambiguous named runtime resource', () => {
  assert.throws(
    () =>
      parsePackagedAndroidConfig(
        manifest(
          '{&quot;expo-channel-name&quot;:&quot;testflight&quot;}',
          '@ref/0x7f1200aa',
        ),
        `${resources('file:fingerprint')}\n0x7f1200ab - string/expo_runtime_version\n  config (default): [STR] "file:fingerprint"`,
      ),
    /exactly one string\/expo_runtime_version resource ID/,
  )
})

test('rejects a similarly named header instead of guessing the channel', () => {
  assert.throws(
    () =>
      parsePackagedAndroidConfig(
        manifest('{&quot;channel&quot;:&quot;production&quot;}'),
        resources('file:fingerprint'),
      ),
    /omit expo-channel-name/,
  )
})
