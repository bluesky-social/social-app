/*
 * Fails if a workspace project imports a package it doesn't declare.
 *
 * With `nodeLinker: hoisted`, every package in the workspace sits in the root
 * node_modules, so an undeclared import resolves fine locally and only breaks
 * once the project is installed on its own (a `pnpm deploy`, or a published
 * package). oxlint has no `import/no-extraneous-dependencies`, so this is a
 * small stand-in for it.
 *
 * Usage: node scripts/check-undeclared-imports.mjs
 */
import {builtinModules} from 'node:module'
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

/*
 * The app at the root isn't checked yet. It imports from too many places
 * (Metro and Babel aliases, Expo's virtual modules) for a simple scan, and it
 * moves into apps/bluesky in Phase 2.
 */
const PROJECT_GLOBS = ['packages', 'services']

const SOURCE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
])

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'ios',
  'android',
  '.turbo',
])

const builtins = new Set(builtinModules.flatMap(m => [m, `node:${m}`]))

function listProjects() {
  const projects = []
  for (const dir of PROJECT_GLOBS) {
    const abs = path.join(repoRoot, dir)
    if (!existsSync(abs)) continue
    for (const name of readdirSync(abs)) {
      const projectDir = path.join(abs, name)
      if (existsSync(path.join(projectDir, 'package.json'))) {
        projects.push(projectDir)
      }
    }
  }
  return projects
}

function listSourceFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (entry.name.startsWith('.')) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      // a nested project is checked on its own
      if (existsSync(path.join(abs, 'package.json'))) continue
      files.push(...listSourceFiles(abs))
    } else if (
      SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
      !entry.name.endsWith('.d.ts') &&
      statSync(abs).size < 1_000_000
    ) {
      files.push(abs)
    }
  }
  return files
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1')
}

// the lookbehind skips look-alikes such as `Array.from('x')` or `'--import'`
const SPECIFIER_PATTERNS = [
  /(?<![\w$.'"-])from\s*['"]([^'"\n]+)['"]/g,
  /(?<![\w$.'"-])import\s*['"]([^'"\n]+)['"]/g,
  /(?<![\w$.'"-])import\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /(?<![\w$.'"-])require\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /(?<![\w$.'"-])require\.resolve\s*\(\s*['"]([^'"\n]+)['"]/g,
]

function importedSpecifiers(source) {
  const code = stripComments(source)
  const specifiers = new Set()
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of code.matchAll(pattern)) specifiers.add(match[1])
  }
  return specifiers
}

function packageName(specifier) {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    specifier.includes(':') ||
    builtins.has(specifier) ||
    builtins.has(specifier.split('/')[0])
  ) {
    return null
  }
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function typesPackage(name) {
  return name.startsWith('@')
    ? `@types/${name.slice(1).replace('/', '__')}`
    : `@types/${name}`
}

let failures = 0

for (const projectDir of listProjects()) {
  const pkg = JSON.parse(
    readFileSync(path.join(projectDir, 'package.json'), 'utf8'),
  )
  const declared = new Set([
    pkg.name,
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ])

  for (const file of listSourceFiles(projectDir)) {
    for (const specifier of importedSpecifiers(readFileSync(file, 'utf8'))) {
      const name = packageName(specifier)
      if (!name || declared.has(name) || declared.has(typesPackage(name))) {
        continue
      }
      failures++
      console.error(
        `${path.relative(repoRoot, file)}: imports "${name}", which ${pkg.name} doesn't declare in its package.json`,
      )
    }
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} undeclared import(s). Add each package to the importing project's package.json (as a peerDependency for workspace packages that the app provides, such as react or expo-modules-core).`,
  )
  process.exit(1)
}

console.log('check-undeclared-imports: OK')
