/* oxlint-disable import/no-nodejs-modules -- Runs the Actions release executor against a stateful API fixture. */
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const fixture = pathToFileURL(
  resolve('scripts/release/__fixtures__/live.cjs'),
).href

function run(scenario) {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {simulate} from ${JSON.stringify(fixture)}; console.log(JSON.stringify(await simulate(process.argv[1])))`,
      scenario,
    ],
    {encoding: 'utf8'},
  )
  if (result.status !== 0) throw new Error(result.stderr)
  return JSON.parse(result.stdout)
}

test('creates a new draft and three pinned builds; a second preparation is refused', () => {
  expect(run('new')).toMatchObject({
    first: {
      preparedSha: 'b'.repeat(40),
      execution: {
        status: 'builds-dispatched',
        steps: expect.arrayContaining([
          expect.objectContaining({
            id: 'build-ios',
            result: 'dispatched',
            run: {
              id: 100,
              url: 'https://github.com/owner/repo/actions/runs/100',
              status: 'dispatched',
              conclusion: null,
            },
          }),
        ]),
      },
    },
    second: {
      execution: {
        status: 'blocked',
        reason: expect.stringContaining('recover manually'),
      },
    },
    counts: {firstWrites: 9, writes: 9, runs: 3, releases: 1},
  })
})

test('unverified draft visibility blocks live preparation before any writes', () => {
  expect(run('hidden')).toMatchObject({
    first: {execution: {status: 'blocked'}},
    counts: {firstWrites: 0, writes: 0},
  })
})

test('a failed dispatch stops for manual recovery without sending another request', () => {
  expect(run('lost-dispatch')).toMatchObject({
    first: {
      execution: {
        status: 'blocked',
        reason: expect.stringContaining('No automatic retries'),
      },
    },
    second: {
      execution: {
        status: 'blocked',
        reason: expect.stringContaining('recover manually'),
      },
    },
    counts: {firstWrites: 7, writes: 7, runs: 1},
  })
})
