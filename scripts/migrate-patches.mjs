#!/usr/bin/env node
// One-shot migration from patch-package to pnpm-native patches.
//
// Strategy: delegate the heavy lifting to pnpm.
//   1. Wipe node_modules and reinstall with the postinstall patch-package
//      step skipped, so we get pristine upstream sources. (`patch-package
//      --reverse` is unreliable here -- pnpm caches the patched files in
//      its store, so subsequent `pnpm patch` extractions still come back
//      patched.)
//   2. Group ./patches/*.patch files by package (parse filename).
//   3. For each group:
//        pnpm patch <pkg>@<version> --edit-dir <tmp> --ignore-existing
//      to get a clean extraction.
//   4. Apply each patch-package diff in filename order with `git apply`,
//      stripping the leading "a/node_modules/<pkg>/" prefix.
//   5. pnpm patch-commit <tmp>  -- writes the squashed patch to ./patches
//      and updates pnpm.patchedDependencies in package.json.
//
// The old patch-package files are left in place for review. Once you've
// confirmed the new patches look right:
//   - delete the old <pkg>+<version>.patch files (and the .patch.md notes)
//   - remove patch-package from devDependencies
//   - drop `patch-package &&` from the postinstall script in package.json
//   - run `pnpm install` to re-sync node_modules with the new patches

import {execFileSync} from 'node:child_process'
import {mkdtemp, readdir, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

const root = process.cwd()
const patchesDir = path.join(root, 'patches')

// Parse a patch-package filename. Returns the package name or null.
//
//   react-native+0.81.5.patch                     -> react-native
//   react-native+0.81.5+002+ScrollForwarder.patch -> react-native
//   @discord+bottom-sheet+4.6.1.patch             -> @discord/bottom-sheet
//
// patch-package also supports nested (parent++child) patches, but Bluesky
// doesn't use them, so we bail loudly rather than guessing.
function parsePackageName(filename) {
  const base = filename.replace(/\.patch$/, '')
  if (base.includes('++')) {
    throw new Error(`nested patch not supported: ${filename}`)
  }
  const segments = base.split('+')
  const versionIdx = segments.findIndex((s, i) => i > 0 && /^\d/.test(s))
  if (versionIdx < 1) return null
  const encoded = segments.slice(0, versionIdx).join('+')
  // @scope+name -> @scope/name (only the first '+' is the scope separator)
  return encoded.startsWith('@') ? encoded.replace('+', '/') : encoded
}

const patchFiles = (await readdir(patchesDir))
  .filter(f => f.endsWith('.patch'))
  .sort()

const groups = new Map()
for (const file of patchFiles) {
  const pkg = parsePackageName(file)
  if (!pkg) {
    console.warn(`skip (cannot parse): ${file}`)
    continue
  }
  if (!groups.has(pkg)) groups.set(pkg, [])
  groups.get(pkg).push(file)
}

if (groups.size === 0) {
  console.error(`No patch-package patches found in ${patchesDir}`)
  process.exit(1)
}

// Wipe and reinstall without postinstall scripts so pnpm extracts clean
// upstream sources. --force re-fetches even if files are already in the
// store; --ignore-scripts skips the patch-package postinstall.
console.log('Removing node_modules...')
await rm(path.join(root, 'node_modules'), {recursive: true, force: true})
console.log('Reinstalling fresh (--force --ignore-scripts)...')
execFileSync('pnpm', ['install', '--force', '--ignore-scripts'], {
  stdio: 'inherit',
})

for (const [pkg, files] of groups) {
  const installedPkgJson = path.join(
    root,
    'node_modules',
    ...pkg.split('/'),
    'package.json',
  )
  let version
  try {
    version = JSON.parse(await readFile(installedPkgJson, 'utf8')).version
  } catch {
    console.error(`skip ${pkg}: not installed (run pnpm install first)`)
    continue
  }

  console.log(
    `\n== ${pkg}@${version}  (${files.length} patch${files.length === 1 ? '' : 'es'})`,
  )

  const tmp = await mkdtemp(path.join(tmpdir(), 'pnpm-patch-'))
  try {
    execFileSync(
      'pnpm',
      ['patch', `${pkg}@${version}`, '--edit-dir', tmp, '--ignore-existing'],
      {stdio: 'inherit'},
    )

    // Patch paths look like a/node_modules/<pkg>/path/to/file. We need to
    // strip a/ + node_modules/ + every segment of the package name to land
    // at the package root.
    const stripLevel = 2 + pkg.split('/').length

    let applied = 0
    let stale = 0
    for (const file of files) {
      const patchPath = path.join(patchesDir, file)
      const gitArgs = [
        'apply',
        `-p${stripLevel}`,
        '--ignore-whitespace',
        '--recount',
      ]
      try {
        execFileSync('git', [...gitArgs, patchPath], {cwd: tmp, stdio: 'pipe'})
        console.log(`  applied  ${file}`)
        applied++
        continue
      } catch {}

      // git apply's --ignore-whitespace doesn't tolerate whitespace-only
      // mismatches in *context* lines. GNU patch's -l does, so fall back.
      try {
        execFileSync(
          'patch',
          [
            `-p${stripLevel}`,
            '-l',
            '-N',
            '--no-backup-if-mismatch',
            '-i',
            patchPath,
          ],
          {cwd: tmp, stdio: 'pipe'},
        )
        console.log(`  applied  ${file}  (via GNU patch -l)`)
        applied++
        continue
      } catch {}

      // If reversing applies, the patch is already in upstream -- stale.
      try {
        execFileSync('git', [...gitArgs, '--reverse', '--check', patchPath], {
          cwd: tmp,
          stdio: 'pipe',
        })
        console.log(`  STALE    ${file}  (already in upstream, skipping)`)
        stale++
      } catch {
        console.error(`  FAILED   ${file}  (does not apply, not stale)`)
        throw new Error(
          `patch ${file} does not apply against ${pkg}@${version}`,
        )
      }
    }

    if (applied === 0) {
      console.log(`  -> no live patches for ${pkg}, skipping pnpm patch-commit`)
      continue
    }

    execFileSync('pnpm', ['patch-commit', tmp], {stdio: 'inherit'})
  } finally {
    await rm(tmp, {recursive: true, force: true})
  }
}

console.log(`
Done. Review the generated patches in ./patches, then:
  - delete the old <pkg>+<version>.patch files (and any .patch.md notes you
    don't want to keep)
  - remove patch-package from devDependencies
  - drop "patch-package &&" from the postinstall script in package.json
  - run pnpm install to confirm everything still applies
`)
