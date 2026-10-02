#!/usr/bin/env node

import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {applyIconSet, buildIconSet} from './lib.mts'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const check = process.argv.includes('--check')
const verbose = process.argv.includes('--verbose')
const sourceRoot = path.join(repoRoot, 'assets/icons')
const outputRoot = path.join(repoRoot, 'src/components/icons')

try {
  const result = await buildIconSet({outputRoot, scanRoot: path.join(repoRoot, 'src'), sourceRoot})
  const differences = await applyIconSet({check, outputRoot, result, sourceRoot})
  if (check && differences.length > 0) {
    console.error(`Icon codegen is stale. Run pnpm icons:generate:\n${differences.map(file => `- ${file}`).join('\n')}`)
    process.exitCode = 1
  } else {
    const verb = check ? 'checked' : 'generated'
    console.log(`${verb} ${result.icons.length} icons in ${result.tsOutputs.size} modules`)
    if (result.warnings.length > 0) {
      console.warn(
        `${result.warnings.length} icons use a non-standard viewBox:\n${result.warnings.map(warning => `- ${warning}`).join('\n')}`,
      )
    }
    console.log(`${result.deprecatedImports.length} deprecated imports remain`)
    if (result.deprecatedImports.length > 0 && !verbose) {
      console.log('run with --verbose to list deprecated import locations')
    }
    if (verbose) {
      for (const imported of result.deprecatedImports) {
        console.log(
          `- ${imported.sourceFile}: ${imported.modulePath}.${imported.exportName} -> ${imported.targetModule}`,
        )
      }
    }
    if (result.holdouts.length > 0) {
      console.warn(`${result.holdouts.length} compatibility aliases belong to handwritten modules and must be maintained there`)
      for (const holdout of result.holdouts) {
        console.warn(
          `- ${holdout.sourceFile}: ${holdout.modulePath}.${holdout.exportName} -> ${holdout.targetModule}`,
        )
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
