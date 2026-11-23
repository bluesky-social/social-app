import assert from 'node:assert/strict'
import cluster, {type Worker} from 'node:cluster'
import {once} from 'node:events'
import http, {type Server} from 'node:http'
import {type AddressInfo} from 'node:net'
import {test} from 'node:test'
import {setTimeout as sleep} from 'node:timers/promises'
import {fileURLToPath} from 'node:url'

import {CardCluster} from '../src/cluster.js'
import {envToCfg} from '../src/config.js'
import {CardService} from '../src/index.js'
import {collectWorkerMetrics} from '../src/metrics.js'

cluster.setupPrimary({
  exec: fileURLToPath(new URL('./worker.ts', import.meta.url)),
  execArgv: ['--import', 'tsx'],
})

function url(server: Server, path: string) {
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`
}

function get(url: string) {
  return new Promise<{status: number; body: string}>((resolve, reject) => {
    const req = http.get(url, {agent: false}, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => (body += chunk))
      res.on('end', () => resolve({status: res.statusCode!, body}))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(10000, () => req.destroy(new Error('Request timed out')))
  })
}

function samples(body: string, metric: string) {
  return body
    .split('\n')
    .filter(
      line => line.startsWith(`${metric}{`) || line.startsWith(`${metric} `),
    )
    .map(line => {
      const labels = Object.fromEntries(
        [...line.matchAll(/(\w+)="((?:\\.|[^"\\])*)"/g)].map(match => [
          match[1],
          JSON.parse(`"${match[2]}"`),
        ]),
      ) as Record<string, string>
      return {labels, value: Number(line.slice(line.lastIndexOf(' ') + 1))}
    })
}

async function eventually<T>(check: () => Promise<T | undefined>) {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    const value = await check()
    if (value !== undefined) return value
    await sleep(50)
  }
  throw new Error('Condition did not become true')
}

function workers() {
  return Object.values(cluster.workers ?? {}).filter(
    (worker): worker is Worker => !!worker,
  )
}

function listenerCounts(worker: Worker) {
  return ['message', 'exit', 'disconnect', 'error'].map(event =>
    worker.listenerCount(event),
  )
}

const httpCounts = (body: string) =>
  new Map(
    samples(body, 'http_request_duration_seconds_count')
      .filter(sample => sample.labels.path === '/test/:value')
      .map(sample => [sample.labels.worker, sample.value]),
  )

const restartCount = (body: string) =>
  samples(body, 'bskyogcard_worker_restarts_total').reduce(
    (sum, sample) => sum + sample.value,
    0,
  )

test(
  'collects all four workers through failures and graceful shutdown',
  {timeout: 60000},
  async t => {
    const service = new CardCluster(0, 4)
    const allWorkers: Worker[] = []
    const onFork = (worker: Worker) => allWorkers.push(worker)
    cluster.on('fork', onFork)
    t.after(async () => {
      for (const worker of workers()) worker.process.kill('SIGCONT')
      await service.destroy()
      cluster.off('fork', onFork)
    })
    const listening = once(cluster, 'listening')
    await service.start()
    const [, address] = await listening
    const appUrl = `http://127.0.0.1:${address.port}`
    const metricsUrl = url(service.metricsServer!, '/metrics')
    const scrape = () => get(metricsUrl)
    const ready = () =>
      eventually(async () => {
        const res = await scrape()
        return res.status === 200 ? res.body : undefined
      })
    await ready()

    const expected = new Map(['0', '1', '2', '3'].map(slot => [slot, 0]))
    const slotsByPid = new Map<number, string>()
    const request = async () => {
      const res = await get(`${appUrl}/test/never-a-label-${Math.random()}`)
      assert.equal(res.status, 200)
      const {worker, pid} = JSON.parse(res.body)
      slotsByPid.set(pid, worker)
      expected.set(worker, expected.get(worker)! + 1)
      return {worker, pid}
    }
    for (let i = 0; i < 24; i++) await request()
    assert.equal(slotsByPid.size, 4)
    const initial = await ready()
    assert.deepEqual(httpCounts(initial), expected)
    assert.equal(samples(initial, 'bskyogcard_workers_live')[0].value, 4)
    assert.equal(samples(initial, 'bskyogcard_workers_expected')[0].value, 4)
    assert.equal(restartCount(initial), 0)
    assert.doesNotMatch(initial, /never-a-label/)
    assert.doesNotMatch(initial, /^up(?:\{| )/m)
    assert.equal(samples(initial, 'process_start_time_seconds').length, 4)
    assert.equal(samples(initial, 'nodejs_eventloop_lag_p99_seconds').length, 4)
    for (const res of await Promise.all(Array.from({length: 6}, scrape))) {
      assert.equal(res.status, 200)
      assert.deepEqual(httpCounts(res.body), expected)
      assert.equal(samples(res.body, 'process_cpu_seconds_total').length, 4)
    }

    const cpu = new Map(
      samples(initial, 'process_cpu_seconds_total').map(sample => [
        sample.labels.worker,
        sample.value,
      ]),
    )
    for (let i = 0; i < 3; i++) {
      for (const sample of samples(
        await ready(),
        'process_cpu_seconds_total',
      )) {
        assert.ok(sample.value >= cpu.get(sample.labels.worker)!)
        cpu.set(sample.labels.worker, sample.value)
      }
    }

    // Kill a worker while a scrape is waiting for its response.
    const victim = workers()[0]
    const slot = slotsByPid.get(victim.process.pid!)!
    victim.process.kill('SIGSTOP')
    const requested = once(service.metricsServer!, 'request')
    const interrupted = scrape()
    await requested
    victim.process.kill('SIGKILL')
    assert.equal((await interrupted).status, 503)
    const afterRestart = await ready()
    assert.equal(restartCount(afterRestart), 1)
    await assert.rejects(
      collectWorkerMetrics([victim], new AbortController().signal),
      /Incomplete worker metrics/,
    )
    await assert.rejects(
      collectWorkerMetrics([], new AbortController().signal),
      /Incomplete worker metrics/,
    )
    const expectedAfterRestart = new Map(expected)
    expectedAfterRestart.delete(slot)
    assert.deepEqual(httpCounts(afterRestart), expectedAfterRestart)
    assert.deepEqual(
      samples(afterRestart, 'process_cpu_seconds_total')
        .map(sample => sample.labels.worker)
        .sort(),
      ['0', '1', '2', '3'],
    )
    expected.set(slot, 0)
    await eventually(async () => {
      const response = await request()
      return response.worker === slot ? response : undefined
    })
    assert.deepEqual(httpCounts(await ready()), expected)

    // A hung worker fails the entire scrape, without accumulating listeners.
    const stalled = workers()[0]
    const before = workers().map(
      worker => [worker, listenerCounts(worker)] as const,
    )
    stalled.process.kill('SIGSTOP')
    const started = Date.now()
    const healthyRequests = Array.from({length: 4}, () =>
      get(`${appUrl}/_health`),
    )
    assert.equal((await Promise.any(healthyRequests)).status, 200)
    const failed = await scrape()
    assert.equal(failed.status, 503)
    assert.match(failed.body, /Metrics collection failed/)
    assert.ok(Date.now() - started < 9000)
    for (const [worker, counts] of before) {
      assert.deepEqual(listenerCounts(worker), counts)
    }
    stalled.process.kill('SIGCONT')
    await Promise.all(healthyRequests)
    assert.deepEqual(httpCounts(await ready()), expected)
    assert.equal(restartCount(await ready()), 1)

    // Shutdown aborts in-flight collection and does not count intentional exits.
    stalled.process.kill('SIGSTOP')
    const shutdownRequested = once(service.metricsServer!, 'request')
    const pending = scrape()
    await shutdownRequested
    const stopped = service.destroy()
    assert.equal((await pending).status, 503)
    stalled.process.kill('SIGCONT')
    await stopped
    assert.equal(restartCount(await service.registry.metrics()), 1)
    assert.equal(
      samples(await service.registry.metrics(), 'bskyogcard_workers_live')[0]
        .value,
      0,
    )
    assert.equal(service.metricsServer!.listening, false)
    assert.ok(allWorkers.every(worker => worker.isDead()))
    for (const worker of allWorkers) {
      assert.throws(() => process.kill(worker.process.pid!, 0), {code: 'ESRCH'})
    }
  },
)

test(
  'reaps an unresponsive worker after the graceful shutdown deadline',
  {timeout: 30000},
  async t => {
    const service = new CardCluster(0, 1)
    t.after(() => service.destroy())
    const listening = once(cluster, 'listening')
    await service.start()
    await listening
    const worker = workers()[0]
    worker.process.kill('SIGSTOP')
    const started = Date.now()
    await service.destroy()
    assert.ok(Date.now() - started < 22000)
    assert.ok(worker.isDead())
    assert.equal(restartCount(await service.registry.metrics()), 0)
  },
)

test('preserves non-clustered metrics, isolation, and request draining', async t => {
  const cfg = envToCfg({port: 0, metricsPort: 0})
  const first = await CardService.create(cfg)
  const second = await CardService.create(cfg)
  t.after(async () => {
    await Promise.all([first.destroy(), second.destroy()])
  })
  let begin!: () => void
  const began = new Promise<void>(resolve => (begin = resolve))
  let finish!: () => void
  const finished = new Promise<void>(resolve => (finish = resolve))
  first.app.get('/slow', async (_req, res) => {
    begin()
    await finished
    res.end('drained')
  })
  await Promise.all([first.start(), second.start()])
  const metrics = await get(url(first.metricsServer!, '/metrics'))
  assert.equal(metrics.status, 200)
  assert.deepEqual(
    samples(metrics.body, 'process_cpu_seconds_total').map(
      sample => sample.labels.worker,
    ),
    ['0'],
  )
  assert.doesNotMatch(
    (await get(url(second.metricsServer!, '/metrics'))).body,
    /path="\/slow"/,
  )
  const response = get(url(first.server!, '/slow'))
  await began
  let stopped = false
  const stopping = first.destroy().then(() => (stopped = true))
  await sleep(50)
  assert.equal(stopped, false)
  finish()
  assert.equal((await response).body, 'drained')
  await stopping
  assert.equal(first.server!.listening, false)
  assert.equal(first.metricsServer!.listening, false)
})
