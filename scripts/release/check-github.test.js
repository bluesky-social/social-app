/* oxlint-disable import/no-nodejs-modules -- Tests execute the Node release checker with API fixtures. */
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

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
    const scenario = process.argv[1]
    const report = {identity: {branch:'release-1.2.3',tag:'1.2.3',filename:'RELEASE-1.2.3.md',githubReleaseName:'Release 1.2.3'},sourceSha:'source',document:'exact document',publicChangelog:'notes'}
    const file = {path:'app.js',mode:'100644',type:'blob',sha:'app'}
    const data = {
      '': {permissions:{push:scenario !== 'hidden'}},
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
    if (scenario === 'new') for (const key of Object.keys(data)) if (key.includes('matching-refs') || key.startsWith('releases')) data[key] = []
    if (scenario === 'moved') data['git/commits/candidate'].parents = [{sha:'other'}]
    if (scenario === 'changed') data['git/trees/after?recursive=1'].tree[0] = {...file,sha:'changed'}
    if (scenario === 'truncated') data['git/trees/after?recursive=1'].truncated = true
    if (scenario === 'published') data['releases?per_page=100&page=1'][0].draft = false
    if (scenario === 'pagination') {
      data['releases?per_page=100&page=2'] = data['releases?per_page=100&page=1']
      data['releases?per_page=100&page=1'] = Array.from({length:100},()=>({tag_name:'other'}))
    }
    const read = async path => {
      if (scenario === 'api-error') throw new Error('HTTP 403')
      if (!(path in data)) throw new Error('Unexpected request ' + path)
      return data[path]
    }
    const checked = await checkGitHub(report, read)
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
    'hidden',
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
