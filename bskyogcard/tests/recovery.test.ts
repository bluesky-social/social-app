import assert from 'node:assert/strict'
import {fork} from 'node:child_process'
import cluster from 'node:cluster'
import {once} from 'node:events'
import http from 'node:http'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

import {CardCluster} from '../src/cluster.js'

const workerPath = fileURLToPath(
  new URL('./recovery-worker.ts', import.meta.url),
)
cluster.setupPrimary({exec: workerPath, execArgv: ['--import', 'tsx']})

function get(port: number, path: string) {
  return new Promise<{status: number; body: string}>((resolve, reject) => {
    const req = http.get({host: '127.0.0.1', port, path, agent: false}, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => (body += chunk))
      res.on('end', () => resolve({status: res.statusCode!, body}))
      res.on('error', reject)
    })
    req.on('error', reject)
  })
}

test(
  'replaces a trapped worker while ordinary failures keep it alive',
  {timeout: 30000},
  async t => {
    const service = new CardCluster(0, 1)
    t.after(() => service.destroy())
    const listening = once(cluster, 'listening')
    await service.start()
    const [worker, address] = await listening
    const before = await get(address.port, '/pid')
    assert.equal((await get(address.port, '/failure/ordinary')).status, 500)
    assert.deepEqual(await get(address.port, '/pid'), before)

    const slowStarted = once(worker, 'message')
    const slow = get(address.port, '/slow')
    assert.deepEqual((await slowStarted)[0], {type: 'slow-started'})
    const exited = once(worker, 'exit')
    const replaced = once(cluster, 'listening')
    const failed = await get(address.port, '/failure/wasm')
    assert.deepEqual(failed, {status: 500, body: 'server error'})
    assert.equal(worker.isDead(), false)
    worker.send('release-slow')
    assert.deepEqual(await slow, {status: 200, body: 'drained'})
    assert.equal((await exited)[0], 1)
    const [, replacementAddress] = await replaced
    const after = await get(replacementAddress.port, '/pid')
    assert.equal(after.status, 200)
    assert.notEqual(after.body, before.body)
    assert.equal((await get(replacementAddress.port, '/_health')).status, 200)
    assert.ok(
      (await service.registry.metrics()).includes(
        'bskyogcard_worker_restarts_total{worker="0"} 1',
      ),
    )
  },
)

test(
  'single-process mode exits unsuccessfully after returning the failed response',
  {timeout: 30000},
  async t => {
    const child = fork(workerPath, [], {
      execArgv: ['--import', 'tsx'],
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      env: {...process.env, LOG_ENABLED: 'true', LOG_DESTINATION: undefined},
    })
    t.after(() => {
      if (child.exitCode === null) child.kill('SIGKILL')
    })
    let stdout = ''
    let stderr = ''
    child.stdout!.setEncoding('utf8').on('data', chunk => (stdout += chunk))
    child.stderr!.setEncoding('utf8').on('data', chunk => (stderr += chunk))
    const exited = once(child, 'exit')
    const [ready] = await once(child, 'message')
    const before = await get(ready.port, '/pid')
    assert.equal((await get(ready.port, '/failure/ordinary')).status, 500)
    assert.deepEqual(await get(ready.port, '/pid'), before)
    assert.deepEqual(await get(ready.port, '/failure/diagnostics'), {
      status: 500,
      body: 'server error',
    })
    assert.deepEqual(await exited, [1, null], stderr)
    const errors = stdout
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .filter(entry => entry.msg === 'request error')
    assert.equal(errors.length, 2)
    assert.equal(errors[0].restartRequired, false)
    assert.equal(errors[1].restartRequired, true)
    assert.equal(errors[1].err.type, 'RuntimeError')
    assert.equal(errors[1].err.message, 'simulated renderer trap')
    assert.ok(errors[1].err.stack.includes('recovery-worker.ts'))
    assert.equal(errors[1].renderContextError, 'simulated diagnostics failure')
  },
)
