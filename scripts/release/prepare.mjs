import {execFileSync} from 'node:child_process'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {
  createReleaseDocument,
  deriveReleaseIdentity,
  parseReleaseDocument,
} from './model.mjs'

/** Read a selected checkout and describe release preparation without changing it. */
export function prepareRelease(sourceDirectory, releaseVersion) {
  const identity = deriveReleaseIdentity(releaseVersion)
  const source = resolve(sourceDirectory)
  const git = (...args) =>
    execFileSync('git', ['-C', source, ...args], {encoding: 'utf8'}).trim()
  if (git('status', '--porcelain', '--untracked-files=no')) {
    throw new Error(
      'The source checkout has tracked changes. Commit or discard them first.',
    )
  }
  if (git('rev-parse', '--is-shallow-repository') !== 'false') {
    throw new Error('Full Git history is required to generate the changelog.')
  }
  const sourceSha = git('rev-parse', 'HEAD')
  const packageVersion = JSON.parse(
    readFileSync(join(source, 'package.json'), 'utf8'),
  ).version
  const require = createRequire(join(source, 'package.json'))
  delete require.cache[require.resolve('./app.config.js')]
  const expo = require('./app.config.js')({}).expo
  if (packageVersion !== releaseVersion || expo.version !== releaseVersion) {
    throw new Error(
      `Requested ${releaseVersion}, but package version is ${packageVersion} and Expo version is ${expo.version}.`,
    )
  }
  if (expo.runtimeVersion?.policy !== 'appVersion') {
    throw new Error(
      'Expected Expo runtimeVersion.policy to be appVersion. Review the runtime policy before preparing this release.',
    )
  }
  const previousTag =
    git('tag', '--merged', sourceSha, '--sort=-version:refname')
      .split('\n')
      .find(
        tag =>
          /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(tag) &&
          tag !== releaseVersion,
      ) || null
  const changelog =
    git(
      'log',
      '--no-merges',
      '--pretty=format:- %s',
      previousTag ? `${previousTag}..${sourceSha}` : sourceSha,
    ) || '- No changes since the previous release.'
  const document = createReleaseDocument(releaseVersion, changelog)
  const {publicChangelog} = parseReleaseDocument(document, {
    filename: identity.filename,
  })
  return {
    mode: 'dry-run',
    identity,
    sourceSha,
    packageVersion,
    expoVersion: expo.version,
    runtimePolicy: expo.runtimeVersion.policy,
    previousTag,
    document,
    publicChangelog,
    steps: [
      `Create ${identity.branch} from ${sourceSha}.`,
      `Commit ${identity.filename} to that branch. Its contents are included below.`,
      `Create draft GitHub Release "${identity.githubReleaseName}" with tag ${identity.tag} and the public notes below.`,
      'Request production iOS, Android, and web builds from the prepared commit.',
      'After successful builds, record their actual build numbers and source commit in the release file.',
      'Leave the app release to a person.',
    ],
    notChecked: [
      'Existing GitHub branches, tags, and releases are not checked for conflicts or safe reuse.',
      'Builds, credentials, store submissions, and deployment are not exercised.',
      'The prepared commit, build numbers, and final release file do not exist yet.',
      'Translations are not refreshed. Release notes are provisional commit titles.',
    ],
  }
}

/** Format the same report for the terminal and the Actions summary. */
export function renderReport(report) {
  return [
    `# Release ${report.identity.version}: dry run`,
    '',
    'Version checks passed. No release branch, commit, tag, GitHub Release, build, or deployment was created.',
    '',
    `- Source commit: ${report.sourceSha}`,
    `- Package / Expo version: ${report.packageVersion} / ${report.expoVersion}`,
    `- Runtime policy: ${report.runtimePolicy}`,
    `- Previous release tag: ${report.previousTag ?? 'none (using all reachable history)'}`,
    `- Release branch: ${report.identity.branch}`,
    `- Release tag: ${report.identity.tag}`,
    `- GitHub Release: ${report.identity.githubReleaseName}`,
    '',
    '## GitHub checks',
    '',
    ...(report.github
      ? [
          `Result: ${report.github.status}. Checked at ${report.github.checkedAt}.`,
          ...report.github.checks.map(
            check =>
              `- ${check.resource}: **${check.action}** — ${check.detail}`,
          ),
          '',
          'Create/reuse describes a proposed action only. If any check is blocked, the whole preparation is blocked. These reads are a snapshot; a live run must recheck before writing.',
        ]
      : [
          'GitHub has not been checked. Run check-github.mjs to inspect existing resources.',
        ]),
    '',
    ...(report.execution
      ? [
          '## Planned requests',
          '',
          `Dry run: ${report.execution.status}. No requests below were sent.`,
          ...(report.execution.reason ? [report.execution.reason] : []),
          ...(report.execution.warnings ?? []).map(
            warning => `- Unverified: ${warning}`,
          ),
          '',
          ...report.execution.steps.flatMap(step => [
            `### ${step.label}`,
            '',
            `Result: ${step.result ?? 'not reached'}.`,
            ...(step.precondition
              ? [`Precondition: ${step.precondition}`]
              : []),
            ...(step.checkedAt
              ? [`GitHub rechecked at ${step.checkedAt}.`]
              : []),
            ...(step.dependsOn?.length
              ? [`Depends on: ${step.dependsOn.join(', ')}.`]
              : []),
            '',
            '<pre>',
            JSON.stringify(step.request ?? {reuse: step.value}, null, 2)
              .replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;'),
            '</pre>',
            '',
          ]),
          ...(report.execution.notes ?? []).map(note => `- ${note}`),
          '',
          'Still pending:',
          ...report.execution.pending.map(item => `- ${item}`),
          '',
        ]
      : []),
    '## What a real run would do',
    '',
    ...report.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Still unverified',
    '',
    ...report.notChecked
      .filter(item => !report.github || !item.startsWith('Existing GitHub'))
      .map(item => `- ${item}`),
    '',
    `## ${report.identity.filename}`,
    '',
    '<pre>',
    report.document
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;'),
    '</pre>',
    '',
    '## Public release notes',
    '',
    report.publicChangelog,
    '',
  ].join('\n')
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [version, source, output, ...extra] = process.argv.slice(2)
    if (!version || !source || extra.length) {
      throw new Error(
        'Usage: node scripts/release/prepare.mjs VERSION SOURCE_DIRECTORY [NEW_OUTPUT_DIRECTORY]',
      )
    }
    const report = prepareRelease(source, version)
    const markdown = renderReport(report)
    if (output) {
      mkdirSync(output)
      for (const [name, content] of Object.entries({
        'README.md': markdown,
        'report.json': JSON.stringify(report, null, 2) + '\n',
        [report.identity.filename]: report.document,
        'github-release-body.md': report.publicChangelog + '\n',
      }))
        writeFileSync(join(output, name), content, {flag: 'wx'})
    }
    process.stdout.write(markdown)
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
