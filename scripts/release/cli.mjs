#!/usr/bin/env node

import {readFileSync, writeFileSync} from 'node:fs'

import {
  ReleaseError,
  appendOtaChangelog,
  createReleaseDocument,
  deriveReleaseIdentity,
  extractPublicChangelog,
  finalizeReleaseDocument,
  parseReleaseDocument,
} from './model.mjs'

function usage() {
  return `Usage:
  node scripts/release/cli.mjs identity <version>
  node scripts/release/cli.mjs create <version> <changelog-file> <output-file>
  node scripts/release/cli.mjs validate <release-file> [prepared|final]
  node scripts/release/cli.mjs extract-public <release-file>
  node scripts/release/cli.mjs append-ota <release-file> <sequence> <changelog-file>
  node scripts/release/cli.mjs finalize <release-file> <source-tag> <source-sha> <ios-build-number> <android-version-code>`
}

function requireArgs(args, count) {
  if (args.length !== count) throw new ReleaseError(usage())
}

function read(path) {
  return readFileSync(path, 'utf8')
}

function write(path, content) {
  writeFileSync(path, content, 'utf8')
}

function run([command, ...args]) {
  switch (command) {
    case 'identity': {
      requireArgs(args, 1)
      console.log(JSON.stringify(deriveReleaseIdentity(args[0]), null, 2))
      return
    }
    case 'create': {
      requireArgs(args, 3)
      const [version, changelogFile, outputFile] = args
      write(outputFile, createReleaseDocument(version, read(changelogFile)))
      console.log(`Created ${outputFile}`)
      return
    }
    case 'validate': {
      if (args.length < 1 || args.length > 2) throw new ReleaseError(usage())
      const [releaseFile, stage = 'prepared'] = args
      const parsed = parseReleaseDocument(read(releaseFile), {
        filename: releaseFile.split('/').at(-1),
        stage,
      })
      console.log(
        `Validated ${releaseFile} as a ${stage} release for ${parsed.metadata.releaseVersion}`,
      )
      return
    }
    case 'extract-public': {
      requireArgs(args, 1)
      process.stdout.write(`${extractPublicChangelog(read(args[0]))}\n`)
      return
    }
    case 'append-ota': {
      requireArgs(args, 3)
      const [releaseFile, rawSequence, changelogFile] = args
      const sequence = Number(rawSequence)
      write(
        releaseFile,
        appendOtaChangelog(read(releaseFile), sequence, read(changelogFile)),
      )
      console.log(`Added OTA ${rawSequence} to ${releaseFile}`)
      return
    }
    case 'finalize': {
      requireArgs(args, 5)
      const [
        releaseFile,
        sourceTag,
        sourceSha,
        iosBuildNumber,
        androidVersionCode,
      ] = args
      write(
        releaseFile,
        finalizeReleaseDocument(read(releaseFile), {
          sourceTag,
          sourceSha,
          iosBuildNumber,
          androidVersionCode,
        }),
      )
      console.log(`Finalized ${releaseFile}`)
      return
    }
    default:
      throw new ReleaseError(usage())
  }
}

try {
  run(process.argv.slice(2))
} catch (error) {
  if (error instanceof ReleaseError) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  } else {
    throw error
  }
}
