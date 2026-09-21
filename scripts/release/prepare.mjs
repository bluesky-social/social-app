import {createHash} from 'node:crypto'
import {isDeepStrictEqual} from 'node:util'

import {
  createReleaseDocument,
  deriveReleaseIdentity,
  extractPublicChangelog,
  parseReleaseDocument,
} from './model.mjs'

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

/**
 * Plan against an explicit simulated resource snapshot. No Git or GitHub writes.
 * Candidate IDs deliberately cannot be mistaken for deployable Git SHAs.
 */
export function planPreparation(input, observed = {}) {
  const identity = deriveReleaseIdentity(input.releaseVersion)
  requireValue(
    typeof input.sourceSha === 'string' &&
      /^[0-9a-f]{40}$/.test(input.sourceSha),
    'sourceSha must be a resolved full commit SHA.',
  )
  for (const key of ['packageVersion', 'expoVersion', 'runtimeVersion']) {
    requireValue(
      input[key] === identity.version,
      `${key} must match releaseVersion.`,
    )
  }
  requireValue(
    observed !== null &&
      typeof observed === 'object' &&
      !Array.isArray(observed),
    'An explicit resource snapshot is required.',
  )
  const document = createReleaseDocument(identity.version, input.changelog)
  parseReleaseDocument(document, {
    filename: identity.filename,
    stage: 'prepared',
  })
  const candidate = {
    sourceSha: input.sourceSha,
    filename: identity.filename,
    document,
    releaseVersion: identity.version,
  }
  const candidateId = `simulation:${createHash('sha256').update(JSON.stringify(candidate)).digest('hex')}`
  const expected = {
    candidate: {id: candidateId, ...candidate},
    branch: {name: identity.branch, candidateId},
    tag: {name: identity.tag, candidateId},
    release: {
      name: identity.githubReleaseName,
      tag: identity.tag,
      candidateId,
      draft: true,
      body: extractPublicChangelog(document),
    },
  }
  for (const key of Object.keys(observed)) {
    requireValue(
      Object.hasOwn(expected, key),
      `Unknown resource in snapshot: ${key}`,
    )
  }
  const actions = []
  const conflicts = []
  for (const [resource, value] of Object.entries(expected)) {
    const existing = observed[resource]
    if (existing === undefined) {
      actions.push({resource, action: 'create', expected: value})
    } else if (isDeepStrictEqual(existing, value)) {
      actions.push({resource, action: 'reuse', expected: value})
    } else {
      conflicts.push(
        `${resource} exists with different or unverifiable identity; leave it unchanged.`,
      )
    }
  }
  // A matching ref without its candidate provenance is not safe to reconstruct.
  if (
    observed.candidate === undefined &&
    ['branch', 'tag', 'release'].some(key => observed[key] !== undefined)
  ) {
    conflicts.push(
      'Existing resources have no candidate provenance; leave them unchanged.',
    )
  }
  return {
    mode: 'simulation',
    status: conflicts.length ? 'blocked' : 'ready',
    identity,
    sourceSha: input.sourceSha,
    candidateId,
    document,
    publicChangelog: expected.release.body,
    conflicts,
    actions: conflicts.length ? [] : actions,
  }
}

/**
 * Execute only in a copied in-memory snapshot. stopAfter models a crash after
 * a durable step but before the following step (including a lost final response).
 */
export function simulatePreparation(input, observed = {}, {stopAfter} = {}) {
  requireValue(
    stopAfter === undefined ||
      (Number.isInteger(stopAfter) && stopAfter >= 0 && stopAfter <= 4),
    'stopAfter must be an integer from 0 through 4.',
  )
  const plan = planPreparation(input, observed)
  const state = structuredClone(observed)
  const events = []
  if (plan.status === 'blocked') return {...plan, state, events}
  for (const step of plan.actions) {
    if (events.length === stopAfter)
      return {...plan, status: 'interrupted', state, events}
    state[step.resource] = structuredClone(step.expected)
    events.push({resource: step.resource, action: step.action})
  }
  return {
    ...plan,
    status: stopAfter === 4 ? 'interrupted' : 'complete',
    state,
    events,
  }
}
