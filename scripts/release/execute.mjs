import {checkGitHub} from './check-github.mjs'
import {buildWorkflows, planRelease, workflowHashes} from './plan.mjs'

/** Ignore mutable counters and asset lists, but retain every release identity field. */
function snapshot(checked) {
  const observed = checked.github.observed
  const object = ref =>
    ref ? {type: ref.object.type, sha: ref.object.sha} : null
  return {
    branch: object(observed.branch),
    tag: object(observed.tag),
    candidate: observed.candidateSha,
    tree: observed.sourceTreeSha,
    releases: observed.releases.map(
      ({id, tag_name, name, body, draft, prerelease}) => ({
        id,
        tag_name,
        name,
        body,
        draft,
        prerelease,
      }),
    ),
  }
}

/** Resolve only outputs produced or verified by this execution. */
function resolveOutputs(value, outputs) {
  if (Array.isArray(value))
    return value.map(item => resolveOutputs(item, outputs))
  if (value && typeof value === 'object') {
    if ('fromStep' in value) {
      const resolved = outputs[value.fromStep]?.[value.field]
      if (!resolved)
        throw new Error(`Missing output ${value.fromStep}.${value.field}.`)
      return resolved
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveOutputs(item, outputs),
      ]),
    )
  }
  return value
}

/** Apply the same plan as the preview, stopping on conflicts or ambiguous writes. */
export async function executeRelease(
  report,
  repository,
  client,
  hashes = workflowHashes(),
) {
  let checked = await checkGitHub(report, client.read)
  const initial = planRelease(checked, repository, hashes)
  const execution = {
    ...initial,
    mode: 'live',
    status: 'running',
    notes: [
      'Native submissions are disabled. Web builds push a production image to ECR.',
      'Build run IDs are recorded below. Dispatched does not mean the build succeeded.',
      'Partial failures require manual recovery. Do not rerun preparation to retry a build.',
    ],
  }
  const result = {...checked, mode: 'live', execution}
  let active
  try {
    if (initial.status === 'blocked') throw new Error(initial.reason)
    if (checked.github.status !== 'ready')
      throw new Error(
        'Live preparation requires verified draft visibility and conflict-free GitHub checks.',
      )
    const observed = checked.github.observed
    if (observed.branch || observed.tag || observed.releases.length) {
      throw new Error(
        'Release resources already exist. Inspect the previous report and recover manually; live preparation does not resume existing releases.',
      )
    }
    const expected = snapshot(checked)
    const verify = async () => {
      checked = await checkGitHub(report, client.read)
      result.github = checked.github
      if (
        checked.github.status !== 'ready' ||
        JSON.stringify(snapshot(checked)) !== JSON.stringify(expected)
      ) {
        throw new Error(
          'GitHub changed or could not be verified. Stopping without overwriting remote state.',
        )
      }
      result.preparedSha = checked.github.observed.candidateSha
    }
    const verifyWorkflow = async build => {
      const workflow = await client.read(`actions/workflows/${build.file}`)
      if (
        workflow.state !== 'active' ||
        workflow.path !== `.github/workflows/${build.file}`
      )
        throw new Error(
          `Workflow ${build.file} is disabled or its path differs.`,
        )
    }
    // Check all workflows before making even the first release write.
    for (const build of buildWorkflows) await verifyWorkflow(build)
    const outputs = {}
    for (const step of execution.steps) {
      active = step
      await verify()
      step.checkedAt = checked.github.checkedAt
      step.request.body = resolveOutputs(step.request.body, outputs)
      const build = buildWorkflows.find(
        item => step.id === `build-${item.platform.toLowerCase()}`,
      )
      if (build) {
        await verifyWorkflow(build)
        step.result = 'dispatch-requested'
        const run = await client.write(
          'POST',
          `actions/workflows/${build.file}/dispatches`,
          {...step.request.body, return_run_details: true},
        )
        if (
          !Number.isSafeInteger(run?.workflow_run_id) ||
          run.workflow_run_id <= 0
        ) {
          throw new Error(
            'GitHub did not return a build run ID. Inspect Actions manually; the build may already be running.',
          )
        }
        step.run = {
          id: run.workflow_run_id,
          url: run.html_url,
          status: 'dispatched',
          conclusion: null,
        }
        step.result = 'dispatched'
        continue
      }
      const path = step.request.path.slice(`repos/${repository}/`.length)
      step.result = 'write-requested'
      const response = await client.write(
        step.request.method,
        path,
        step.request.body,
      )
      outputs[step.id] = response
      step.output = {
        sha: response.sha ?? response.object?.sha,
        id: response.id,
      }
      step.result = 'created'
      if (step.id === 'branch')
        expected.branch = {type: 'commit', sha: report.sourceSha}
      if (step.id === 'branch-tip') {
        expected.branch = {type: 'commit', sha: outputs['prepared-commit'].sha}
        expected.candidate = outputs['prepared-commit'].sha
      }
      if (step.id === 'tag')
        expected.tag = {type: 'commit', sha: outputs['prepared-commit'].sha}
      if (step.id === 'draft') {
        const {tag_name, name, body, draft, prerelease} = step.request.body
        expected.releases = [
          {id: response.id, tag_name, name, body, draft, prerelease},
        ]
      }
      await verify()
    }
    execution.status = 'builds-dispatched'
    result.preparedSha = expected.candidate
  } catch (error) {
    execution.status = 'blocked'
    execution.reason = `${error.message} No automatic retries were attempted. Inspect the report and GitHub before taking further action.`
    if (active) active.result = active.result ?? 'blocked'
  }
  result.github.repository = repository
  return result
}
