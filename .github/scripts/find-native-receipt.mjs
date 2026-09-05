#!/usr/bin/env node
import fs from 'node:fs/promises'
import process from 'node:process'
import {pathToFileURL} from 'node:url'

export function parsePositiveInteger(value, label) {
  if (!/^[1-9][0-9]*$/.test(value ?? '')) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

export function expectedArtifactName({platform, buildNumber, runId, attempt}) {
  if (!['ios', 'android'].includes(platform)) {
    throw new Error('platform must be ios or android')
  }
  if (!/^[0-9]+$/.test(buildNumber ?? '')) {
    throw new Error('build-number must be numeric')
  }
  parsePositiveInteger(runId, 'run-id')
  parsePositiveInteger(attempt, 'run-attempt')
  return `native-build-${platform}-production-${buildNumber}-${runId}-${attempt}`
}

export function validateTrustedRun(run, {repository, workflow}) {
  if (
    run?.conclusion !== 'success' ||
    run?.head_repository?.full_name !== repository ||
    run?.path !== workflow ||
    !/^[0-9a-f]{40}$/.test(run?.head_sha ?? '')
  ) {
    throw new Error('Receipt artifact came from an untrusted native build run')
  }
  return run.head_sha
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  })
  if (!response.ok)
    throw new Error(`GitHub API request failed (${response.status})`)
  return response.json()
}

async function findArtifact({apiUrl, repository, runId, name, token}) {
  for (let page = 1; page <= 10; page++) {
    const result = await githubJson(
      `${apiUrl}/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100&page=${page}`,
      token,
    )
    const artifact = result.artifacts?.find(
      item => item.name === name && !item.expired,
    )
    if (artifact) return artifact
    if (!result.artifacts || result.artifacts.length < 100) return undefined
  }
  throw new Error('Receipt artifact lookup exceeded 1000 artifacts')
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const args = Object.fromEntries(
    Array.from({length: argv.length / 2}, (_, index) => [
      argv[index * 2]?.replace(/^--/, ''),
      argv[index * 2 + 1],
    ]),
  )
  const runId = parsePositiveInteger(args['run-id'], 'run-id')
  const attempt = parsePositiveInteger(args['run-attempt'], 'run-attempt')
  const name = expectedArtifactName({
    platform: args.platform,
    buildNumber: args['build-number'],
    runId,
    attempt,
  })
  const repository = env.GITHUB_REPOSITORY
  const token = env.GH_TOKEN
  const output = env.GITHUB_OUTPUT
  if (!repository || !token || !output)
    throw new Error('GitHub Actions environment is incomplete')

  let artifact
  try {
    artifact = await findArtifact({
      apiUrl: env.GITHUB_API_URL ?? 'https://api.github.com',
      repository,
      runId,
      name,
      token,
    })
  } catch (error) {
    console.error(`Warning: receipt artifact lookup was unavailable: ${error}`)
    await fs.appendFile(output, `available=false\nartifact-name=${name}\n`)
    return
  }
  if (!artifact) {
    console.error(
      `Warning: ${name} is missing or expired; target could not be verified`,
    )
    await fs.appendFile(output, `available=false\nartifact-name=${name}\n`)
    return
  }

  const workflow = `.github/workflows/build-submit-${args.platform}.yml`
  let run
  try {
    run = await githubJson(
      `${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${repository}/actions/runs/${runId}`,
      token,
    )
  } catch (error) {
    console.error(`Warning: receipt build-run lookup was unavailable: ${error}`)
    await fs.appendFile(output, `available=false\nartifact-name=${name}\n`)
    return
  }
  const headSha = validateTrustedRun(run, {repository, workflow})
  await fs.appendFile(
    output,
    `available=true\nartifact-name=${name}\nhead-sha=${headSha}\n`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
