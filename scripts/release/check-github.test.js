/* oxlint-disable import/no-nodejs-modules -- Tests execute the Node release checker with API fixtures. */
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const plannerUrl = pathToFileURL(resolve('scripts/release/plan.mjs')).href

const moduleUrl = pathToFileURL(
  resolve('scripts/release/check-github.mjs'),
).href

/** Run the real checker with a strict fake reader; no network calls. */
function check(scenario) {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import {checkGitHub, githubReader} from ${JSON.stringify(moduleUrl)}
    import {dryRunRelease, buildWorkflows} from ${JSON.stringify(plannerUrl)}
    const scenario = process.argv[1]
    const hashes = Object.fromEntries(buildWorkflows.map(build => [build.file, build.file]))
    const report = {identity: {branch:'release-1.2.3',tag:'1.2.3',filename:'RELEASE-1.2.3.md',githubReleaseName:'Release 1.2.3'},sourceSha:'source',document:'exact document',publicChangelog:'notes'}
    const file = {path:'app.js',mode:'100644',type:'blob',sha:'app'}
    const data = {
      '': {permissions:{push:!scenario.includes('hidden')}},
      'git/matching-refs/heads/release-1.2.3': [{ref:'refs/heads/release-1.2.3',object:{type:'commit',sha:'candidate'}}],
      'git/matching-refs/tags/1.2.3': [{ref:'refs/tags/1.2.3',object:{type:'tag',sha:'annotated'}}],
      'git/tags/annotated': {object:{type:'commit',sha:'candidate'}},
      'git/commits/candidate': {parents:[{sha:'source'}],tree:{sha:'after'}},
      'git/commits/source': {tree:{sha:'before'}},
      'git/trees/before?recursive=1': {tree:[file]},
      'git/trees/after?recursive=1': {tree:[file,{path:report.identity.filename,type:'blob',mode:'100644',sha:'document'}]},
      'git/blobs/document': {encoding:'base64',content:Buffer.from('exact document').toString('base64')},
      'releases?per_page=100&page=1': [{id:1,tag_name:'1.2.3',draft:true,prerelease:false,name:'Release 1.2.3',body:'notes'}],
    }
    if (scenario === 'new' || ['plan-new','plan-drift','plan-workflow','plan-hidden'].includes(scenario)) for (const key of Object.keys(data)) if (key.includes('matching-refs') || key.startsWith('releases')) data[key] = []
    if (scenario === 'moved') data['git/commits/candidate'].parents = [{sha:'other'}]
    if (scenario === 'changed') data['git/trees/after?recursive=1'].tree[0] = {...file,sha:'changed'}
    if (scenario === 'truncated') data['git/trees/after?recursive=1'].truncated = true
    if (scenario === 'published' || scenario === 'plan-hidden-published') data['releases?per_page=100&page=1'][0].draft = false
    if (scenario === 'pagination') {
      data['releases?per_page=100&page=2'] = data['releases?per_page=100&page=1']
      data['releases?per_page=100&page=1'] = Array.from({length:100},()=>({tag_name:'other'}))
    }
    if (scenario.startsWith('plan-')) {
      const files = buildWorkflows.map(build => ({path:'.github/workflows/' + build.file,mode:'100644',type:'blob',sha:build.file}))
      data['git/trees/before?recursive=1'].tree.push(...files)
      data['git/trees/after?recursive=1'].tree.push(...files)
    }
    if (scenario === 'plan-workflow') data['git/trees/before?recursive=1'].tree.pop()
    let passes = 0
    for (const build of buildWorkflows) data['actions/workflows/' + build.file] = {state:scenario === 'plan-disabled' ? 'disabled_manually' : 'active',path:'.github/workflows/' + build.file}
    const read = async path => {
      if (path === '') passes++
      if (scenario === 'plan-drift' && passes === 3 && path === 'git/matching-refs/heads/release-1.2.3') return [{ref:'refs/heads/release-1.2.3',object:{type:'commit',sha:'source'}}]

      if (scenario === 'api-error') throw new Error('HTTP 403')
      if (!(path in data)) throw new Error('Unexpected request ' + path)
      return data[path]
    }
    const checked = scenario.startsWith('plan-') ? await dryRunRelease(report, 'owner/repo', read, hashes) : await checkGitHub(report, read)
    if (scenario === 'get-only') {
      globalThis.fetch = async (url, options) => {
        if (url !== 'https://api.github.com/repos/owner/repo') throw new Error('Wrong repository endpoint')
        if (options.method !== 'GET' || options.body) throw new Error('Mutation attempted')
        return {ok:false,status:404}
      }
      try { await githubReader('owner/repo','dummy')('') } catch(error) { checked.transportError = error.message }
    }
    process.stdout.write(JSON.stringify(checked))
  `,
      scenario,
    ],
    {encoding: 'utf8'},
  )
  if (result.status !== 0) throw new Error(result.stderr)
  return JSON.parse(result.stdout)
}

test('missing resources propose creation; matching resources including annotated tags are reused', () => {
  expect(check('new')).toMatchObject({
    github: {
      status: 'ready',
      checks: expect.arrayContaining([
        expect.objectContaining({resource: 'branch', action: 'create'}),
      ]),
    },
  })
  expect(check('matching')).toMatchObject({
    github: {
      status: 'ready',
      checks: expect.arrayContaining([
        expect.objectContaining({resource: 'release file', action: 'reuse'}),
        expect.objectContaining({resource: 'GitHub Release', action: 'reuse'}),
      ]),
    },
  })
})

test('moved branches, unrelated file changes, published releases, and incomplete evidence block preparation', () => {
  for (const scenario of [
    'moved',
    'changed',
    'published',
    'truncated',
    'api-error',
  ]) {
    expect(check(scenario)).toMatchObject({github: {status: 'blocked'}})
  }
})

test('checks later pages of releases', () => {
  expect(check('pagination')).toMatchObject({
    github: {
      status: 'ready',
      checks: expect.arrayContaining([
        expect.objectContaining({resource: 'GitHub Release', action: 'reuse'}),
      ]),
    },
  })
})

test('reader only sends GET and treats HTTP errors as failures, not missing resources', () => {
  expect(check('get-only')).toMatchObject({
    transportError: expect.stringContaining('HTTP 404'),
  })
})

test('new preparation prints dependent requests and skips every write and build dispatch', () => {
  expect(check('plan-new')).toMatchObject({
    execution: {
      status: 'complete',
      steps: expect.arrayContaining([
        expect.objectContaining({
          id: 'prepared-commit',
          result: 'skipped-dry-run',
          request: expect.objectContaining({
            body: expect.objectContaining({
              tree: {fromStep: 'release-tree', field: 'sha'},
              parents: ['source'],
            }),
          }),
        }),
        expect.objectContaining({
          id: 'branch-tip',
          request: expect.objectContaining({
            body: {
              sha: {fromStep: 'prepared-commit', field: 'sha'},
              force: false,
            },
          }),
        }),
        expect.objectContaining({
          id: 'build-ios',
          result: 'skipped-dry-run',
          request: expect.objectContaining({
            body: {
              ref: '1.2.3',
              inputs: {
                profile: 'production',
                submit: false,
                testFlightGroup: 'none',
                sourceRef: {fromStep: 'prepared-commit', field: 'sha'},
              },
            },
          }),
        }),
        expect.objectContaining({
          id: 'build-web',
          result: 'skipped-dry-run',
          request: expect.objectContaining({
            body: {
              ref: '1.2.3',
              inputs: {sourceRef: {fromStep: 'prepared-commit', field: 'sha'}},
            },
          }),
        }),
      ]),
    },
  })
})

test('retry reuses the verified commit and puts its real SHA into native build inputs', () => {
  expect(check('plan-matching')).toMatchObject({
    execution: {
      status: 'complete',
      steps: expect.arrayContaining([
        expect.objectContaining({
          id: 'prepared-commit',
          action: 'reuse',
          value: 'candidate',
        }),
        expect.objectContaining({
          id: 'build-android',
          request: expect.objectContaining({
            body: expect.objectContaining({
              inputs: {
                profile: 'production',
                submit: false,
                sourceRef: 'candidate',
              },
            }),
          }),
        }),
      ]),
    },
  })
})

test('a change between proposed writes stops the remaining plan', () => {
  expect(check('plan-drift')).toMatchObject({
    execution: {
      status: 'blocked',
      steps: expect.arrayContaining([
        expect.objectContaining({id: 'branch', result: 'skipped-dry-run'}),
        expect.objectContaining({id: 'release-tree', result: 'blocked'}),
      ]),
    },
  })
})

test('a missing or changed build workflow blocks all proposed operations', () => {
  expect(check('plan-drift')).not.toMatchObject({
    execution: {
      steps: expect.arrayContaining([
        expect.objectContaining({id: 'build-web', result: 'skipped-dry-run'}),
      ]),
    },
  })
  expect(check('plan-disabled')).toMatchObject({
    execution: {status: 'blocked', reason: expect.stringContaining('disabled')},
  })

  expect(check('plan-workflow')).toMatchObject({
    execution: {
      status: 'blocked',
      reason: expect.stringContaining('build-and-push-bskyweb-aws.yaml'),
    },
  })
})

test('planned build inputs match the actual dispatch definitions and no live option exists', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import {readFileSync} from 'node:fs'
    import {createRequire} from 'node:module'
    import assert from 'node:assert/strict'
    import {buildWorkflows,workflowHashes} from ${JSON.stringify(plannerUrl)}
    const yaml = createRequire(import.meta.url)('js-yaml')
    for (const build of buildWorkflows) {
      const workflow = yaml.load(readFileSync('.github/workflows/' + build.file,'utf8'))
      assert('workflow_dispatch' in workflow.on)
      const definitions = workflow.on.workflow_dispatch?.inputs ?? {}
      const inputs = {...build.inputs,sourceRef:'candidate'}
      for (const [key,value] of Object.entries(inputs)) {
        assert(definitions[key], key)
        if (definitions[key].type === 'boolean') assert.equal(typeof value,'boolean')
        if (definitions[key].options) assert(definitions[key].options.includes(value))
      }
      for (const [key,definition] of Object.entries(definitions)) if (definition.required && definition.default === undefined) assert(key in inputs)
      assert.match(workflowHashes()[build.file], /^[a-f0-9]{40}$/)
      const job = workflow.jobs.build ?? workflow.jobs['bskyweb-container-aws']
      const checkout = job.steps.find(step => step.uses?.startsWith('actions/checkout@'))
      assert.equal(checkout.with.ref, '${'$'}{{ inputs.sourceRef || github.sha }}')
      assert.equal(job.outputs['source-sha'], '${'$'}{{ steps.source.outputs.sha }}')
      if (build.platform !== 'web') {
        assert.equal(workflow.on.workflow_call.inputs.sourceRef.default, '')
        assert.equal(workflow.on.workflow_call.inputs.submit.default, true)
        assert.equal(workflow.jobs.submit.if, '${'$'}{{ inputs.submit != false }}')
        assert.equal(workflow.jobs.submit.steps.find(step => step.uses?.startsWith('actions/checkout@')).with.ref, '${'$'}{{ needs.build.outputs.source-sha }}')
      } else {
        const metadata = job.steps.find(step => step.uses?.startsWith('docker/metadata-action@'))
        assert(metadata.with.tags.includes('${'$'}{{ steps.source.outputs.sha }}'))
        assert(metadata.with.labels.includes('${'$'}{{ steps.source.outputs.sha }}'))
      }

    }
  `,
    ],
    {encoding: 'utf8'},
  )
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
  const live = spawnSync(
    process.execPath,
    [resolve('scripts/release/plan.mjs'), 'report', 'owner/repo', '--apply'],
    {encoding: 'utf8'},
  )
  expect(live.status).toBe(1)
  expect(live.stderr).toContain('Live execution is not available')
})

test('read-only draft visibility allows a conditional dry-run plan but still catches conflicts', () => {
  expect(check('plan-hidden')).toMatchObject({
    github: {
      status: 'incomplete',
      checks: expect.arrayContaining([
        expect.objectContaining({
          resource: 'GitHub Release',
          action: 'unverified',
        }),
      ]),
    },
    execution: {
      status: 'complete-with-warnings',
      steps: expect.arrayContaining([
        expect.objectContaining({
          id: 'draft',
          precondition: expect.stringContaining('Confirm that no draft exists'),
          result: 'skipped-dry-run',
        }),
        expect.objectContaining({id: 'build-web', result: 'skipped-dry-run'}),
      ]),
    },
  })
  expect(check('plan-hidden-published')).toMatchObject({
    github: {status: 'blocked'},
    execution: {status: 'blocked'},
  })
})
