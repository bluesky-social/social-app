/*
 * Differential runtime test for babel-plugin-lexicon-leaf-imports.
 *
 * The plugin is run with `collectRewrites: true`, which makes it report every
 * member-chain rewrite it performed on the Babel file metadata as
 * `chain -> emitted specifier` (e.g. `'app.bsky.feed.like' ->
 * '../lexicons/app/bsky/feed/like'`). For each reported rewrite the barrel
 * itself is the ground truth: walking the chain's segments over
 * `require('#/lexicons')` must yield the very module the emitted specifier
 * resolves to. `export * as` re-exports the target's module namespace object,
 * so the comparison is `===` through Jest's own resolver on both sides - if
 * the plugin rewired a chain to the wrong module, identity breaks.
 *
 * Scoped to app sources: the SDK's ESM dist does not load through Jest's CJS
 * pipeline, so its rewrites cannot be required here.
 */
import fs from 'node:fs'
import path from 'node:path'

import * as babel from '@babel/core'

const ROOT = path.resolve(__dirname, '../../..')
const PLUGIN = path.join(
  ROOT,
  'plugins/babel-plugin-lexicon-leaf-imports/index.js',
)

function listFiles(dir: string, exts: string[]): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(full, exts))
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      out.push(full)
    }
  }
  return out
}

/**
 * The real transform, reduced to the plugins that participate in import
 * rewriting. react-compiler, lingui, and worklets are omitted for speed; they
 * do not touch import declarations, and their interaction with this plugin is
 * covered by the full Jest suite running the complete config. Returns the
 * rewrite map the plugin collected for this file.
 */
function collectRewrites(file: string): Record<string, string> {
  const code = fs.readFileSync(file, 'utf8')
  const result = babel.transformSync(code, {
    filename: file,
    cwd: ROOT,
    configFile: false,
    babelrc: false,
    presets: [
      [
        require.resolve('@babel/preset-typescript'),
        {isTSX: /\.tsx$/.test(file), allExtensions: true},
      ],
    ],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {alias: {'#': './src'}},
      ],
      [
        PLUGIN,
        {roots: [path.join(ROOT, 'src/lexicons')], collectRewrites: true},
      ],
    ],
  })
  return (result!.metadata as any)?.lexiconLeafImports ?? {}
}

describe('lexicon leaf import rewrites', () => {
  test('every rewritten chain resolves to the same module as the barrel', () => {
    const consumers = listFiles(path.join(ROOT, 'src'), ['.ts', '.tsx']).filter(
      f => fs.readFileSync(f, 'utf8').includes(`from '#/lexicons'`),
    )
    expect(consumers.length).toBeGreaterThan(100)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lexicons = require('#/lexicons')
    const failures: string[] = []
    let rewrites = 0
    for (const file of consumers) {
      for (const [chain, specifier] of Object.entries(collectRewrites(file))) {
        rewrites++
        const viaBarrel = chain
          .split('.')
          .reduce((o: any, k) => o?.[k], lexicons)
        /*
         * The emitted specifier is extension-less, so Jest resolves the leaf
         * the same way it resolves the barrel's own internal re-exports
         * (platform extensions included).
         */
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const direct = require(path.resolve(path.dirname(file), specifier))
        if (viaBarrel !== direct) {
          failures.push(
            `${path.relative(ROOT, file)}: '${chain}' was rewritten to ` +
              `'${specifier}', which is not the module at lexicons.${chain}`,
          )
        }
      }
    }
    /* A sudden collapse means the plugin stopped rewriting anything. */
    expect(rewrites).toBeGreaterThan(100)
    expect(failures).toEqual([])
  }, 240_000)
})
