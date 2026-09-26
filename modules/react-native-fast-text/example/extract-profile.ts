/* eslint-disable import/no-nodejs-modules -- Node-only profiler artifact extraction. */
/* eslint-disable import/consistent-type-specifier-style -- Node must erase type-only TSX dependencies. */
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile, writeFile} from 'node:fs/promises'
import {basename} from 'node:path'
import {gunzipSync, gzipSync} from 'node:zlib'

import type {Result} from './BenchmarkApp'

type Profile = {
  meta: {
    hotCommitIndices: number[]
    profileStartWallMs: number
    totalReactCommits: number
  }
  commits: {
    commitIndex: number
    componentName: string
    didRender: boolean
  }[]
}

const [profilePath, benchmarkPath, outputPath] = process.argv.slice(2)
assert(
  profilePath && benchmarkPath && outputPath,
  'Usage: extract-profile.ts <Argent commits.json[.gz]> <benchmark.json> <output.json>',
)
const input = await readFile(profilePath)
const bytes = profilePath.endsWith('.gz') ? gunzipSync(input) : input
const rawProfile: unknown = JSON.parse(bytes.toString('utf8'))
const profile = rawProfile as Profile
const rawBenchmark: unknown = JSON.parse(await readFile(benchmarkPath, 'utf8'))
const benchmark = rawBenchmark as Result
assert(Array.isArray(profile.commits))
assert(Array.isArray(profile.meta.hotCommitIndices))
assert.equal(
  new Set(profile.meta.hotCommitIndices).size,
  benchmark.samples.length,
)
assert.equal(profile.meta.hotCommitIndices.length, benchmark.samples.length)
assert.equal(benchmark.environment.development, true)
const archivePath = outputPath.replace(/\.json$/, '.commits.json.gz')
assert.notEqual(archivePath, outputPath)
const mounts = benchmark.samples.map((sample, index) => {
  const commitIndex = profile.meta.hotCommitIndices[index]
  const records = profile.commits.filter(
    record => record.commitIndex === commitIndex && record.didRender,
  )
  assert(records.length > 0)
  const counts = new Map<string, number>()
  for (const record of records) {
    counts.set(
      record.componentName,
      (counts.get(record.componentName) ?? 0) + 1,
    )
  }
  return {
    commitIndex,
    renderer: sample.renderer,
    workload: sample.workload,
    round: sample.round,
    warmup: sample.warmup,
    labelCount: sample.count,
    renderedRecords: records.length,
    componentCounts: Object.fromEntries(
      [...counts].sort(([a], [b]) => a.localeCompare(b)),
    ),
  }
})
const summary = {
  schemaVersion: 1,
  profileStartedAt: new Date(profile.meta.profileStartWallMs).toISOString(),
  benchmarkSource: basename(benchmarkPath),
  rawProfileArchive: basename(archivePath),
  rawProfileSha256: createHash('sha256').update(bytes).digest('hex'),
  totalReactCommits: profile.meta.totalReactCommits,
  totalProfilerRecords: profile.commits.length,
  mapping:
    'hotCommitIndices in chronological order correspond to collected benchmark samples; includes tagged warmups',
  caveat:
    'Development structural evidence only. Header and harness renders are included; do not treat general Text counts as cell-only counts.',
  mounts,
}
await writeFile(archivePath, gzipSync(bytes))
await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(`Saved ${outputPath} and ${archivePath}`)
