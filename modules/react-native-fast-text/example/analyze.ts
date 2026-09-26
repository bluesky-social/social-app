/* eslint-disable import/no-nodejs-modules -- This is a Node-only analysis CLI, not app code. */
/* eslint-disable import/consistent-type-specifier-style -- Node must erase type-only TSX dependencies. */
import assert from 'node:assert/strict'
import {readFile, writeFile} from 'node:fs/promises'
import {relative, resolve} from 'node:path'

import type {
  Configuration,
  Renderer,
  Result,
  Sample,
  Workload,
} from './BenchmarkApp'

type Metric = 'jsCommitMs' | 'layoutMs' | 'settledMs'
type Run = Result & {source: string}
type Comparison = {
  workload: Workload
  baseline: Renderer
  renderer: Renderer
  metrics: Record<Metric, {reductionPct: number; bootstrap95Pct: number[]}>
}
type Group = {
  environment: Result['environment']
  configuration: Required<Configuration>
  sources: string[]
  perRun: {source: string; timestamp: string; rows: ReturnType<typeof rows>}[]
  rows: ReturnType<typeof rows>
  comparisons: Comparison[]
}

const metrics: Metric[] = ['jsCommitMs', 'layoutMs', 'settledMs']
const args = process.argv.slice(2)
const outputIndex = args.indexOf('--output')
const output = outputIndex < 0 ? undefined : args.splice(outputIndex, 2)[1]
const releaseIndex = args.indexOf('--release')
const releaseOnly = releaseIndex >= 0
if (releaseOnly) args.splice(releaseIndex, 1)
assert(args.length, 'Pass one or more collected result JSON files')
if (outputIndex >= 0) assert(output, '--output requires a path')

const groups = new Map<string, Run[]>()
for (const path of args) {
  const raw: unknown = JSON.parse(await readFile(path, 'utf8'))
  const result = validate(raw)
  if (releaseOnly && result.environment?.development !== false) continue
  const key = JSON.stringify({
    environment: result.environment,
    configuration: result.configuration,
  })
  const group = groups.get(key) ?? []
  group.push({source: relative(process.cwd(), resolve(path)), ...result})
  groups.set(key, group)
}
assert(groups.size, 'No matching benchmark results')

const summary = {
  schemaVersion: 1,
  method: {
    warmupsExcluded: true,
    percentiles: 'linear interpolation of sorted observations',
    reductionPct: '100 * (1 - candidate median / baseline median)',
    bootstrap:
      '2000 deterministic paired-round resamples, stratified by run; percentile 95% interval for reductionPct',
    caveat:
      'Intervals describe repeated mounts on these devices, not variation across devices or real user sessions.',
  },
  groups: [] as Group[],
}

for (const runs of groups.values()) {
  const {environment, configuration} = runs[0]
  const samples = runs.flatMap(run => run.samples.filter(s => !s.warmup))
  const group: Group = {
    environment,
    configuration,
    sources: runs.map(run => run.source),
    perRun: runs.map(run => ({
      source: run.source,
      timestamp: run.timestamp,
      rows: rows(
        run.samples.filter(s => !s.warmup),
        configuration,
      ),
    })),
    rows: rows(samples, configuration),
    comparisons: [],
  }
  const baseline = configuration.renderers[0]
  for (const workload of configuration.workloads) {
    for (const renderer of configuration.renderers.slice(1)) {
      const comparison: Comparison = {
        workload,
        baseline,
        renderer,
        metrics: {} as Comparison['metrics'],
      }
      for (const metric of metrics) {
        const base = samples.filter(
          s => s.workload === workload && s.renderer === baseline,
        )
        const candidate = samples.filter(
          s => s.workload === workload && s.renderer === renderer,
        )
        comparison.metrics[metric] = {
          reductionPct: reduction(
            base.map(s => s[metric]),
            candidate.map(s => s[metric]),
          ),
          bootstrap95Pct: bootstrap(runs, workload, baseline, renderer, metric),
        }
      }
      group.comparisons.push(comparison)
    }
  }
  summary.groups.push(group)
  console.log(
    `\n${environment.platform} ${environment.osVersion} ${environment.development ? 'development' : 'release'}; ${runs.length} run(s), ${configuration.count} labels`,
  )
  console.table(
    group.rows.map(row => ({
      workload: row.workload,
      renderer: row.renderer,
      n: row.metrics.layoutMs.n,
      'JS median ms': row.metrics.jsCommitMs.median.toFixed(2),
      'layout median ms': row.metrics.layoutMs.median.toFixed(2),
      'layout p25-p75': `${row.metrics.layoutMs.p25.toFixed(2)}-${row.metrics.layoutMs.p75.toFixed(2)}`,
      'settled median ms': row.metrics.settledMs.median.toFixed(2),
    })),
  )
}
if (output) {
  await writeFile(output, JSON.stringify(summary, null, 2) + '\n')
  console.log(`Saved ${output}`)
}

/** Reject incomplete runs and malformed/non-finite measurements. */
function validate(raw: unknown): Result {
  assert(raw && typeof raw === 'object')
  const result = raw as Result
  assert.equal(result.schemaVersion, 1)
  assert.equal(typeof result.environment.development, 'boolean')
  const {renderers, workloads, count, rounds, warmups} = result.configuration
  assert(renderers.length > 0 && workloads.length > 0)
  assert.equal(new Set(renderers).size, renderers.length)
  assert.equal(new Set(workloads).size, workloads.length)
  assert(Number.isInteger(count) && count > 0)
  assert(Number.isInteger(rounds) && rounds > 0)
  assert(Number.isInteger(warmups) && warmups >= 0)
  assert.equal(
    result.samples.length,
    renderers.length * workloads.length * (rounds + warmups),
  )
  const seen = new Set()
  for (const sample of result.samples) {
    assert(renderers.includes(sample.renderer))
    assert(workloads.includes(sample.workload))
    assert.equal(sample.count, count)
    assert(Number.isInteger(sample.round))
    assert(sample.round >= -warmups && sample.round < rounds)
    assert.equal(sample.warmup, sample.round < 0)
    for (const metric of metrics)
      assert(Number.isFinite(sample[metric]) && sample[metric] >= 0)
    const key = `${sample.renderer}/${sample.workload}/${sample.round}`
    assert(!seen.has(key), `Duplicate sample: ${key}`)
    seen.add(key)
  }
  return result
}

/** Linear-interpolated percentile. The input must already be sorted. */
function percentile(sorted: number[], probability: number) {
  const index = (sorted.length - 1) * probability
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

/** Descriptive statistics keep every measured observation, including outliers. */
function stats(values: number[]) {
  const sorted = values.toSorted((a, b) => a - b)
  return {
    n: sorted.length,
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
    min: sorted[0],
    max: sorted.at(-1),
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
  }
}

/** One row per content/renderer combination, without mixing configurations. */
function rows(
  samples: Sample[],
  {workloads, renderers}: Required<Configuration>,
) {
  return workloads.flatMap(workload =>
    renderers.map(renderer => {
      const selected = samples.filter(
        sample => sample.workload === workload && sample.renderer === renderer,
      )
      return {
        workload,
        renderer,
        metrics: {
          jsCommitMs: stats(selected.map(s => s.jsCommitMs)),
          layoutMs: stats(selected.map(s => s.layoutMs)),
          settledMs: stats(selected.map(s => s.settledMs)),
        },
      }
    }),
  )
}

/** Positive means the candidate has a lower median elapsed time. */
function reduction(baseline: number[], candidate: number[]) {
  return 100 * (1 - stats(candidate).median / stats(baseline).median)
}

/** Resample paired rounds within each run, retaining between-run differences. */
function bootstrap(
  runs: Run[],
  workload: Workload,
  baseline: Renderer,
  candidate: Renderer,
  metric: Metric,
) {
  const pairs = runs.map(run => {
    const selected = run.samples.filter(
      s => !s.warmup && s.workload === workload,
    )
    return Array.from({length: run.configuration.rounds}, (_, round) => {
      const base = selected.find(
        s => s.renderer === baseline && s.round === round,
      )
      const other = selected.find(
        s => s.renderer === candidate && s.round === round,
      )
      assert(base && other)
      return [base[metric], other[metric]]
    })
  })
  let seed = 0x12345678
  function random() {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return (seed >>> 0) / 0x100000000
  }
  const reductions = []
  for (let iteration = 0; iteration < 2000; iteration++) {
    const bases = []
    const candidates = []
    for (const run of pairs) {
      for (let index = 0; index < run.length; index++) {
        const pair = run[Math.floor(random() * run.length)]
        bases.push(pair[0])
        candidates.push(pair[1])
      }
    }
    reductions.push(reduction(bases, candidates))
  }
  reductions.sort((a, b) => a - b)
  return [percentile(reductions, 0.025), percentile(reductions, 0.975)]
}
