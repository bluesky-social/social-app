import {executeRelease} from '../execute.mjs'
import {buildWorkflows} from '../plan.mjs'
import {createReleaseDocument, deriveReleaseIdentity} from '../model.mjs'

/** Stateful GitHub fixture: writes change exactly what the checker subsequently reads. */
export async function simulate(scenario) {
  const source = 'a'.repeat(40)
  const candidate = 'b'.repeat(40)
  const version = '1.2.3'
  const report = {
    identity: deriveReleaseIdentity(version),
    sourceSha: source,
    document: createReleaseDocument(version, '- Change'),
    publicChangelog: '## Initial release\n\n- Change',
  }
  const hashes = Object.fromEntries(
    buildWorkflows.map(build => [build.file, build.file]),
  )
  const tree = buildWorkflows.map(build => ({
    path: `.github/workflows/${build.file}`,
    type: 'blob',
    mode: '100644',
    sha: build.file,
  }))
  const state = {
    branch: null,
    tag: null,
    releases: [],
    runs: [],
    writes: [],
  }
  const ref = (name, sha) =>
    sha ? [{ref: `refs/${name}`, object: {type: 'commit', sha}}] : []
  const client = {
    read: async path => {
      let result
      if (path === '') {
        return {permissions: {push: scenario !== 'hidden'}}
      }
      if (path === 'git/matching-refs/heads/release-1.2.3')
        result = ref('heads/release-1.2.3', state.branch)
      else if (path === 'git/matching-refs/tags/1.2.3')
        result = ref('tags/1.2.3', state.tag)
      else if (path === 'releases?per_page=100&page=1') result = state.releases
      else if (path === `git/commits/${source}`)
        result = {tree: {sha: 'before'}}
      else if (path === `git/commits/${candidate}`)
        result = {parents: [{sha: source}], tree: {sha: 'after'}}
      else if (path === 'git/trees/before?recursive=1') result = {tree}
      else if (path === 'git/trees/after?recursive=1')
        result = {
          tree: [
            ...tree,
            {
              path: report.identity.filename,
              mode: '100644',
              type: 'blob',
              sha: 'document',
            },
          ],
        }
      else if (path === 'git/blobs/document')
        result = {
          encoding: 'base64',
          content: Buffer.from(report.document).toString('base64'),
        }
      else if (path.startsWith('actions/workflows/'))
        result = {
          state: 'active',
          path: `.github/workflows/${path.split('/')[2]}`,
        }
      else throw new Error(`Unexpected read: ${path}`)
      return structuredClone(result)
    },
    write: async (method, path, body) => {
      state.writes.push({method, path, body: structuredClone(body)})
      let result
      if (path === 'git/refs' && body.ref.startsWith('refs/heads/')) {
        state.branch = body.sha
        result = {object: {sha: body.sha}}
      } else if (path === 'git/trees') result = {sha: 'new-tree'}
      else if (path === 'git/commits') {
        if (body.tree !== 'new-tree' || body.parents[0] !== source)
          throw new Error('Unresolved commit inputs')
        result = {sha: candidate}
      } else if (path === 'git/refs/heads/release-1.2.3') {
        if (body.force !== false || body.sha !== candidate)
          throw new Error('Unsafe branch advance')
        state.branch = body.sha
        result = {object: {sha: body.sha}}
      } else if (path === 'git/refs' && body.ref.startsWith('refs/tags/')) {
        state.tag = body.sha
        result = {object: {sha: body.sha}}
      } else if (path === 'releases') {
        result = {id: 1, ...body}
        state.releases.push(result)
      } else if (path.endsWith('/dispatches')) {
        const file = path.split('/')[2]
        const id = state.runs.length + 100
        if (
          !body.return_run_details ||
          body.ref !== version ||
          body.inputs.sourceRef !== candidate
        )
          throw new Error('Incorrect dispatch source')
        if (
          file !== 'build-and-push-bskyweb-aws.yaml' &&
          body.inputs.submit !== false
        )
          throw new Error('Store submission enabled')
        const run = {
          id,
          file,
          head_sha: candidate,
          event: 'workflow_dispatch',
          html_url: `https://github.com/owner/repo/actions/runs/${id}`,
          status: 'queued',
          conclusion: null,
        }
        state.runs.push(run)
        result = {workflow_run_id: id, html_url: run.html_url}
      } else throw new Error(`Unexpected write: ${path}`)
      if (scenario === 'lost-dispatch' && path.endsWith('/dispatches')) {
        throw new Error('Response lost after successful write')
      }
      return structuredClone(result)
    },
  }
  const first = await executeRelease(report, 'owner/repo', client, hashes)
  const firstWriteCount = state.writes.length
  const second = await executeRelease(report, 'owner/repo', client, hashes)
  return {
    first,
    second,
    counts: {
      firstWrites: firstWriteCount,
      writes: state.writes.length,
      runs: state.runs.length,
      releases: state.releases.length,
    },
  }
}
