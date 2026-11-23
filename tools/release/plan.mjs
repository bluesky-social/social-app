import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

import {checkGitHub, githubReader} from './check-github.mjs'
import {renderReport} from './prepare.mjs'

export const buildWorkflows = [
  {
    platform: 'iOS',
    file: 'build-submit-ios.yml',
    inputs: {profile: 'production', submit: false, testFlightGroup: 'none'},
  },
  {
    platform: 'Android',
    file: 'build-submit-android.yml',
    inputs: {profile: 'production', submit: false},
  },
  {
    platform: 'web',
    file: 'build-and-push-bskyweb-aws.yaml',
    inputs: {},
  },
]

/** Keep dispatch plans tied to the workflow definitions reviewed with this tool. */
export function workflowHashes() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  return Object.fromEntries(
    buildWorkflows.map(({file}) => {
      const content = readFileSync(join(root, '.github/workflows', file))
      const sha = createHash('sha1')
        .update(`blob ${content.length}\0`)
        .update(content)
        .digest('hex')
      return [file, sha]
    }),
  )
}

/** An output reference is deliberately not a fake Git SHA or an executable API value. */
function output(step, field) {
  return {fromStep: step, field}
}

/** Construct ordered request templates. This function cannot send them. */
export function planRelease(report, repository, hashes) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error('Expected repository owner/name.')
  const plan = {
    mode: 'dry-run',
    status: 'planned',
    steps: [],
    pending: [
      'Build completion and artifact-derived build numbers.',
      'Final release file and manual app release.',
    ],
  }
  if (
    !['ready', 'incomplete'].includes(report.github?.status) ||
    !report.github.observed
  )
    return {
      ...plan,
      status: 'blocked',
      reason: 'GitHub checks must pass before requests can be planned.',
    }
  plan.warnings = report.github.checks
    .filter(check => check.action === 'unverified')
    .map(check => check.detail)
  const {identity, sourceSha, document, publicChangelog} = report
  const {sourceTreeSha, sourceTree, candidateSha} = report.github.observed
  const action = resource =>
    report.github.checks.find(check => check.resource === resource)?.action
  const add = (id, label, method, path, body, dependsOn = []) =>
    plan.steps.push({
      id,
      label,
      dependsOn,
      request: {method, path: `repos/${repository}/${path}`, body},
    })
  const reuse = (id, label, value) =>
    plan.steps.push({id, label, action: 'reuse', value})
  if (action('branch') === 'reuse')
    reuse(
      'branch',
      'Reuse release branch',
      report.github.observed.branch.object.sha,
    )
  else
    add('branch', 'Create release branch', 'POST', 'git/refs', {
      ref: `refs/heads/${identity.branch}`,
      sha: sourceSha,
    })
  let candidate = candidateSha
  if (candidate)
    reuse('prepared-commit', 'Reuse verified release file commit', candidate)
  else {
    add(
      'release-tree',
      'Write release file into a new Git tree',
      'POST',
      'git/trees',
      {
        base_tree: sourceTreeSha,
        tree: [
          {
            path: identity.filename,
            mode: '100644',
            type: 'blob',
            content: document,
          },
        ],
      },
      ['branch'],
    )
    add(
      'prepared-commit',
      'Commit release file',
      'POST',
      'git/commits',
      {
        message: `Prepare release ${identity.version}`,
        tree: output('release-tree', 'sha'),
        parents: [sourceSha],
      },
      ['release-tree'],
    )
    candidate = output('prepared-commit', 'sha')
    add(
      'branch-tip',
      'Advance release branch to prepared commit',
      'PATCH',
      `git/refs/heads/${identity.branch}`,
      {sha: candidate, force: false},
      ['prepared-commit'],
    )
  }
  if (action('tag') === 'reuse')
    reuse('tag', 'Reuse verified release tag', identity.tag)
  else
    add(
      'tag',
      'Create release tag',
      'POST',
      'git/refs',
      {ref: `refs/tags/${identity.tag}`, sha: candidate},
      [candidateSha ? 'prepared-commit' : 'branch-tip'],
    )
  if (action('GitHub Release') === 'reuse')
    reuse(
      'draft',
      'Reuse matching draft release',
      report.github.observed.releases[0].id,
    )
  else
    add(
      'draft',
      'Create draft GitHub Release',
      'POST',
      'releases',
      {
        tag_name: identity.tag,
        target_commitish: candidate,
        name: identity.githubReleaseName,
        body: publicChangelog,
        draft: true,
        prerelease: false,
      },
      ['tag'],
    )
  if (action('GitHub Release') === 'unverified') {
    plan.steps.find(step => step.id === 'draft').precondition =
      `Confirm that no draft exists for tag ${identity.tag} with a token that has release permissions.`
  }
  for (const build of buildWorkflows) {
    const path = `.github/workflows/${build.file}`
    const file = sourceTree.find(entry => entry.path === path)
    if (!hashes[build.file] || file?.sha !== hashes[build.file]) {
      plan.status = 'blocked'
      plan.reason = `Selected source has a missing or different ${path}; its build inputs have not been verified by this tool.`
    }
    add(
      `build-${build.platform.toLowerCase()}`,
      `Request ${build.platform} build`,
      'POST',
      `actions/workflows/${build.file}/dispatches`,
      {
        ref: identity.tag,
        inputs: {
          ...build.inputs,
          sourceRef: candidate,
        },
      },
      ['draft'],
    )
  }
  plan.notes = [
    'Requests are templates only. Objects with fromStep/field refer to outputs that do not exist until a live request succeeds.',
    'All workflow dispatches use the release tag and receive the exact prepared commit. Native builds have store submission disabled.',
    'The web workflow would build and push a production image to ECR. No workflow is dispatched in this dry run.',
    'Existing build runs and receipts are not checked here. A future live runner must prevent duplicate dispatches when retrying.',
  ]
  return plan
}

/** Re-read GitHub before each proposed operation, but never execute a write or dispatch. */
export async function dryRunRelease(
  report,
  repository,
  read,
  hashes = workflowHashes(),
) {
  const checked = await checkGitHub(report, read)
  const plan = planRelease(checked, repository, hashes)
  const baseline = JSON.stringify(checked.github.observed)
  if (plan.status !== 'blocked') {
    for (const step of plan.steps) {
      const fresh = await checkGitHub(report, read)
      step.checkedAt = fresh.github.checkedAt
      if (
        !['ready', 'incomplete'].includes(fresh.github.status) ||
        JSON.stringify(fresh.github.observed) !== baseline
      ) {
        plan.status = 'blocked'
        plan.reason = `GitHub changed or could not be verified before ${step.id}. No requests were sent.`
        step.result = 'blocked'
        plan.latestChecks = fresh.github.checks
        break
      }
      const build = buildWorkflows.find(
        item => step.id === `build-${item.platform.toLowerCase()}`,
      )
      if (build) {
        try {
          const workflow = await read(`actions/workflows/${build.file}`)
          if (
            workflow.state !== 'active' ||
            workflow.path !== `.github/workflows/${build.file}`
          )
            throw new Error('Workflow is disabled or its path differs.')
        } catch (error) {
          plan.status = 'blocked'
          plan.reason = `Cannot request ${build.platform} build: ${error.message}`
          step.result = 'blocked'
          break
        }
      }
      step.result =
        step.action === 'reuse' ? 'verified-reuse' : 'skipped-dry-run'
    }
    if (plan.status !== 'blocked')
      plan.status = plan.warnings.length ? 'complete-with-warnings' : 'complete'
  }
  return {...checked, execution: plan}
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [directory, repository, ...extra] = process.argv.slice(2)
    if (!directory || !repository || extra.length)
      throw new Error(
        'Usage: node scripts/release/plan.mjs REPORT_DIRECTORY OWNER/REPO. Live execution is not available.',
      )
    const report = await dryRunRelease(
      JSON.parse(readFileSync(join(directory, 'report.json'), 'utf8')),
      repository,
      githubReader(repository, process.env.GH_TOKEN),
    )
    report.github.repository = repository
    writeFileSync(
      join(directory, 'report.json'),
      JSON.stringify(report, null, 2) + '\n',
    )
    const markdown = renderReport(report)
    writeFileSync(join(directory, 'README.md'), markdown)
    process.stdout.write(markdown)
    if (report.execution.status === 'blocked') process.exitCode = 1
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
