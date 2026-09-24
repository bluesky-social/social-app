/** @jest-environment node */
/* oxlint-disable import/no-nodejs-modules -- These tests exercise the build configuration. */
import {readFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'

import {transformSync} from '@babel/core'
import minify from 'metro-minify-terser'

const coreDirectory = dirname(require.resolve('@sentry/core/package.json'))
const sentryFilename = join(coreDirectory, 'build/esm/integration.js')

function transform(
  source,
  {filename = sentryFilename, envName = 'production', platform = 'web'} = {},
) {
  return transformSync(source, {
    filename,
    envName,
    configFile: resolve('babel.config.js'),
    babelrc: false,
    compact: false,
    caller: {
      name: 'metro',
      platform,
      isDev: envName !== 'production',
      supportsStaticESM: true,
    },
  }).code
}

async function compress(code) {
  const result = await minify({
    code,
    map: null,
    reserved: [],
    config: {compress: {}, mangle: true},
  })
  return result.code
}

describe.each(['web', 'ios', 'android'])(
  'Sentry debug flags on %s',
  platform => {
    test('removes debug branches in a real SDK consumer, not just the flag module', async () => {
      const code = await compress(
        transform(readFileSync(sentryFilename, 'utf8'), {platform}),
      )
      expect(code).not.toContain('Integration installed:')
      expect(code).not.toContain(
        'Integration skipped because it was already installed:',
      )
      expect(code).toContain('setupOnce')
      expect(code).toContain('addIntegration')
    })

    test('preserves SDK debug branches in development', async () => {
      const code = await compress(
        transform(readFileSync(sentryFilename, 'utf8'), {
          platform,
          envName: 'development',
        }),
      )
      expect(code).toContain('Integration installed:')
      expect(code).toContain('DEBUG_BUILD')
    })

    test('replaces the global debug flag but leaves tracing enabled', async () => {
      const code = await compress(
        transform(
          `
          if (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) {
            report('debug-only-marker')
          }
          if (typeof __SENTRY_TRACING__ === 'undefined' || __SENTRY_TRACING__) {
            startTracing()
          }
        `,
          {platform},
        ),
      )
      expect(code).not.toContain('debug-only-marker')
      expect(code).not.toContain('__SENTRY_DEBUG__')
      expect(code).toContain('__SENTRY_TRACING__')
      expect(code).toContain('startTracing')
    })
  },
)

test.each(['./debug-build.js', '../debug-build.js', '../../debug-build'])(
  'inlines aliased imports from %s without changing shadowed bindings or re-exports',
  source => {
    const code = transform(`
      import {DEBUG_BUILD as sdkDebug, OTHER} from '${source}'
      sdkDebug && report('debug-only-marker')
      export function shadow(sdkDebug) { return sdkDebug }
      export {sdkDebug, OTHER}
      export const flags = {sdkDebug}
    `)
    expect(code).toContain("false && report('debug-only-marker')")
    expect(code).toContain('return sdkDebug')
    expect(code).toContain('export { sdkDebug, OTHER }')
    expect(code).toContain('sdkDebug: false')
  },
)

test.each([
  'src/example.js',
  'node_modules/another-sdk/example.js',
  'node_modules/@sentry-lookalike/core/example.js',
])('does not inline another package or application flag in %s', filename => {
  const code = transform(
    `import {DEBUG_BUILD} from './debug-build.js'; DEBUG_BUILD && report('keep-me')`,
    {filename: resolve(filename)},
  )
  expect(code).toContain("DEBUG_BUILD && report('keep-me')")
})

test('does not inline an unrelated Sentry import', () => {
  const code = transform(`
    import {DEBUG_BUILD} from './another-module.js'
    DEBUG_BUILD && report('keep-me')
  `)
  expect(code).toContain("DEBUG_BUILD && report('keep-me')")
})

test('preserves locally bound debug flags', () => {
  const code = transform(`
    export function local(__SENTRY_DEBUG__, DEBUG_BUILD) {
      return [__SENTRY_DEBUG__, DEBUG_BUILD]
    }
  `)
  expect(code).toContain('return [__SENTRY_DEBUG__, DEBUG_BUILD]')
})

test('recognizes pnpm package paths', () => {
  const code = transform(
    `import {DEBUG_BUILD} from './debug-build.js'; DEBUG_BUILD && report('debug-only-marker')`,
    {
      filename: resolve(
        'node_modules/.pnpm/@sentry+core@10.74.0/node_modules/@sentry/core/build/esm/example.js',
      ),
    },
  )
  expect(code).toContain("false && report('debug-only-marker')")
})
