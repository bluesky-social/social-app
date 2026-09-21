import {readFileSync, writeFileSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

import {renderReport} from './prepare.mjs'

/** GET-only GitHub reader. Missing resources are established by successful lists. */
export function githubReader(repository, token) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !token) {
    throw new Error('A repository (owner/name) and GH_TOKEN are required.')
  }
  return async path => {
    const response = await fetch(
      `https://api.github.com/repos/${repository}${path ? `/${path}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(30000),
      },
    )
    if (!response.ok)
      throw new Error(
        `GitHub GET ${path}: HTTP ${response.status}. No absence or reuse can be assumed.`,
      )
    return response.json()
  }
}

/** Compare actual remote resources, accepting only an exact, single-file preparation commit. */
export async function checkGitHub(report, read) {
  const {identity, sourceSha, document, publicChangelog} = report
  let observed = null
  const checks = []
  const add = (resource, action, detail) =>
    checks.push({resource, action, detail})
  try {
    const repository = await read('')
    const draftVisibility = repository.permissions?.push === true
    if (!draftVisibility) {
      add(
        'draft visibility',
        'unverified',
        'This token cannot establish full draft visibility. Draft creation requires a check with release permissions before execution.',
      )
    }
    const ref = async name => {
      const refs = await read(`git/matching-refs/${name}`)
      if (!Array.isArray(refs))
        throw new Error('Invalid GitHub reference response.')
      return refs.find(item => item.ref === `refs/${name}`) ?? null
    }
    const branch = await ref(`heads/${identity.branch}`)
    const tag = await ref(`tags/${identity.tag}`)
    const releases = []
    for (let page = 1; ; page++) {
      const items = await read(`releases?per_page=100&page=${page}`)
      if (!Array.isArray(items))
        throw new Error('Invalid GitHub releases response.')
      releases.push(...items.filter(item => item.tag_name === identity.tag))
      if (items.length < 100) break
    }
    const base = await read(`git/commits/${sourceSha}`)
    const before = await read(`git/trees/${base.tree.sha}?recursive=1`)
    if (before.truncated || !Array.isArray(before.tree))
      throw new Error('Cannot verify the complete source tree.')
    if (before.tree.some(item => item.path === identity.filename)) {
      throw new Error(
        'Selected source already contains this release file. Select the original source before preparation; existing release metadata will not be overwritten.',
      )
    }
    let candidate = null
    if (!branch) {
      add('branch', 'create', `${identity.branch} does not exist.`)
      add(
        'release file',
        'create',
        `Would commit ${identity.filename}; no prepared commit exists yet.`,
      )
    } else if (branch.object?.type !== 'commit') {
      add('branch', 'blocked', 'Release branch does not point to a commit.')
    } else if (branch.object.sha === sourceSha) {
      add(
        'branch',
        'reuse',
        `Branch still points to the selected source ${sourceSha}.`,
      )
      add(
        'release file',
        'create',
        'The preparation commit has not been made yet.',
      )
    } else {
      const commit = await read(`git/commits/${branch.object.sha}`)
      if (commit.parents?.length !== 1 || commit.parents[0].sha !== sourceSha) {
        add(
          'branch',
          'blocked',
          'Branch has moved or was prepared from a different source.',
        )
      } else {
        const after = await read(`git/trees/${commit.tree.sha}?recursive=1`)
        if (
          before.truncated ||
          after.truncated ||
          !Array.isArray(before.tree) ||
          !Array.isArray(after.tree)
        )
          throw new Error('Cannot verify the complete Git trees.')
        const entries = tree =>
          tree
            .filter(
              item => item.type !== 'tree' && item.path !== identity.filename,
            )
            .map(({path, mode, type, sha}) => ({path, mode, type, sha}))
            .sort((a, b) => a.path.localeCompare(b.path))
        const file = after.tree.find(item => item.path === identity.filename)
        let matches = false
        if (
          file?.type === 'blob' &&
          file.mode === '100644' &&
          JSON.stringify(entries(before.tree)) ===
            JSON.stringify(entries(after.tree))
        ) {
          const blob = await read(`git/blobs/${file.sha}`)
          matches =
            blob.encoding === 'base64' &&
            Buffer.from(blob.content, 'base64').toString('utf8') === document
        }
        if (matches) {
          candidate = branch.object.sha
          add(
            'branch',
            'reuse',
            `Verified preparation commit ${candidate}: same source, same release file, no other file changes.`,
          )
          add(
            'release file',
            'reuse',
            'Contents already match; no new commit is needed.',
          )
        } else
          add(
            'branch',
            'blocked',
            'Release file or other files differ from the expected preparation.',
          )
      }
    }
    observed = {
      branch,
      tag,
      releases,
      sourceTreeSha: base.tree.sha,
      sourceTree: before.tree,
      candidateSha: candidate,
      draftVisibility,
    }
    if (!tag)
      add(
        'tag',
        'create',
        `${identity.tag} does not exist. It would point to the prepared commit.`,
      )
    else {
      let object = tag.object
      for (let depth = 0; object?.type === 'tag' && depth < 10; depth++)
        object = (await read(`git/tags/${object.sha}`)).object
      add(
        'tag',
        candidate && object?.type === 'commit' && object.sha === candidate
          ? 'reuse'
          : 'blocked',
        `Existing tag resolves to ${object?.sha ?? 'an unknown object'}. It must match a verified preparation commit.`,
      )
    }
    if (releases.length === 0)
      add(
        'GitHub Release',
        draftVisibility ? 'create' : 'unverified',
        draftVisibility
          ? `No release uses tag ${identity.tag}.`
          : `No visible release uses tag ${identity.tag}; a hidden draft may exist.`,
      )
    else if (releases.length !== 1)
      add('GitHub Release', 'blocked', 'Multiple releases use this tag.')
    else {
      const release = releases[0]
      const matches =
        candidate &&
        tag &&
        checks.find(item => item.resource === 'tag')?.action === 'reuse' &&
        release.draft === true &&
        release.prerelease === false &&
        release.name === identity.githubReleaseName &&
        release.body === publicChangelog
      add(
        'GitHub Release',
        matches ? 'reuse' : 'blocked',
        matches
          ? `Draft #${release.id} matches the verified tag and public notes.`
          : 'Existing release is published, differs from the expected draft, or has no verified tag and preparation commit.',
      )
    }
  } catch (error) {
    add('GitHub checks', 'blocked', error.message)
  }
  return {
    ...report,
    github: {
      status: checks.some(item => item.action === 'blocked')
        ? 'blocked'
        : checks.some(item => item.action === 'unverified')
          ? 'incomplete'
          : 'ready',
      checkedAt: new Date().toISOString(),
      checks,
      observed,
    },
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [directory, repository, ...extra] = process.argv.slice(2)
    if (!directory || !repository || extra.length)
      throw new Error(
        'Usage: node scripts/release/check-github.mjs REPORT_DIRECTORY OWNER/REPO',
      )
    const report = await checkGitHub(
      JSON.parse(readFileSync(join(directory, 'report.json'), 'utf8')),
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
    if (report.github.status === 'blocked') process.exitCode = 1
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
