#!/usr/bin/env node
/**
 * Verifies that our direct @sentry/browser dependency is pinned to the exact
 * version @sentry/react-native depends on.
 *
 * The web build initializes @sentry/browser directly (src/logger/sentry/
 * {lib,setup}/index.web.ts) to keep the RN SDK layer out of the web bundle,
 * while native still goes through @sentry/react-native, which pins an exact
 * @sentry/browser version internally. If the two versions drift apart, pnpm
 * silently installs two copies of the browser SDK - bloating the bundle and
 * splitting SDK state between them - so when bumping @sentry/react-native,
 * bump @sentry/browser to the version it pins. This check makes drift loud.
 *
 * Usage:  node scripts/check-sentry-browser-version.mjs
 * Exits 1 on mismatch.
 */

import {readFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readPkg = p => JSON.parse(readFileSync(join(root, p), 'utf8'))

const ours = readPkg('package.json').dependencies['@sentry/browser']
const theirs = readPkg('node_modules/@sentry/react-native/package.json')
  .dependencies['@sentry/browser']

if (!ours) {
  console.error(
    'check-sentry-browser-version: @sentry/browser is missing from ' +
      'dependencies in package.json. The web Sentry setup imports it directly.',
  )
  process.exit(1)
}

if (ours !== theirs) {
  console.error(
    `check-sentry-browser-version: @sentry/browser version mismatch.\n` +
      `  package.json pins:            ${ours}\n` +
      `  @sentry/react-native expects: ${theirs}\n` +
      `Set "@sentry/browser": "${theirs}" in package.json so pnpm resolves a ` +
      `single copy of the browser SDK.`,
  )
  process.exit(1)
}

console.log(`check-sentry-browser-version: OK (${ours})`)
