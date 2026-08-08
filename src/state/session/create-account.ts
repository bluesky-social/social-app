import {TID} from '@atproto/common-web'
import {type Client} from '@atproto/lex'
import {PasswordSession} from '@atproto/lex-password-session'
import {toDatetimeString} from '@atproto/syntax'
import {overwriteSavedFeeds, setPersonalDetails, upsertProfile} from '@bsky/sdk'

import {networkRetry} from '#/lib/async/retry'
import {
  DISCOVER_SAVED_FEED,
  IS_PROD_SERVICE,
  TIMELINE_SAVED_FEED,
} from '#/lib/constants'
import {logger} from '#/logger'
import {snoozeBirthdateUpdateAllowedForDid} from '#/state/birthdate'
import {restrictChatSettings} from '#/state/queries/messages/restrictChatSettings'
import {snoozeEmailConfirmationPrompt} from '#/state/shell/reminders'
import {
  prefetchAgeAssuranceServerData,
  setBirthdateForDid,
  setCreatedAtForDid,
} from '#/ageAssurance/data'
import {unsafeGetAndComputeAgeAssurance} from '#/ageAssurance/state'
import {features} from '#/analytics'
import {type app} from '#/lexicons'
import {configureModerationForAccount} from './moderation'
import {
  buildBundle,
  finishPreparation,
  makeSessionHooks,
  type OnSessionChange,
  registerBundleKillSwitch,
  type SessionBundle,
} from './session-core'
import {sessionDataToSessionAccount} from './session-data'
import {type SessionAccount} from './types'

/** Create an account, prepare its session, and start post-signup writes. */
export async function createSessionBundleAndCreateAccount(
  {
    service,
    email,
    password,
    handle,
    birthDate,
    inviteCode,
    verificationPhone,
    verificationCode,
  }: {
    service: string
    email: string
    password: string
    handle: string
    birthDate: Date
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  },
  onSessionChange: OnSessionChange,
): Promise<{account: SessionAccount; bundle: SessionBundle}> {
  let bundle!: SessionBundle
  let accountDid = ''
  const hooks = makeSessionHooks({
    onSessionChange,
    getBundle: () => bundle,
    getDid: () => accountDid,
  })

  const session = await PasswordSession.createAccount(
    {
      email,
      password,
      /* the lexicon types handle as `${string}.${string}`; user input is a plain string */
      handle: handle as `${string}.${string}`,
      inviteCode,
      verificationPhone,
      verificationCode,
    },
    {...hooks, service},
  )

  bundle = buildBundle(session)
  registerBundleKillSwitch(bundle, hooks.kill)
  // Seed the hook and the deferred writes with refresh-stable account fields.
  const earlyAccount = snapshotNewAccount(session, email)
  accountDid = earlyAccount.did

  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  configureModerationForAccount(bundle, earlyAccount)

  const createdAt = toDatetimeString(new Date())
  const birthdate = birthDate.toISOString()

  /*
   * Since we have a race with account creation, profile creation, and AA
   * state, set these values locally to ensure sync reads. Values are written
   * to the server in the next step, so on subsequent reloads, the server will
   * be the source of truth.
   */
  setCreatedAtForDid({did: earlyAccount.did, createdAt})
  setBirthdateForDid({did: earlyAccount.did, birthdate})
  snoozeBirthdateUpdateAllowedForDid(earlyAccount.did)
  // Post-signup writes all target the account's own repo and actor store.
  const pdsClient = bundle.pdsClient
  // Start the prefetch after seeding its synchronous birthdate inputs.
  const aa = prefetchAgeAssuranceServerData({
    appviewClient: bundle.appviewClient,
    accountClient: pdsClient,
  })

  const isProd = Boolean(IS_PROD_SERVICE(service))
  const postSignupTasks: Promise<unknown>[] = [
    savePersonalDetails(pdsClient, birthDate),
    initializeProfile(pdsClient, {handle, createdAt, isProd}),
  ]
  if (isProd) {
    postSignupTasks.push(
      initializeSavedFeeds(pdsClient),
      restrictChatAfterAgeAssurance(aa, pdsClient, earlyAccount.did),
    )
  }
  // Post-signup writes are not required to enter onboarding.
  void reportPostSignupFailures(postSignupTasks)

  try {
    // snooze first prompt after signup, defer to next prompt
    snoozeEmailConfirmationPrompt()
  } catch (e) {
    logger.error(e instanceof Error ? e : String(e), {
      message: `session: failed snoozeEmailConfirmationPrompt`,
    })
  }

  // Preparation may auto-refresh the session while hooks are still disarmed.
  const account = await finishPreparation(
    bundle,
    Promise.all([gates, aa]),
    () => snapshotNewAccount(session, email),
  )
  hooks.arm()
  return {account, bundle}
}

/**
 * Snapshot a just-created session as a `SessionAccount`.
 *
 * `com.atproto.server.createAccount` returns only tokens, handle, did and
 * didDoc, so the session carries no email state or `active` flag until the
 * first refresh. Synthesize those fields from the creation input so the
 * persisted account does not briefly claim the email is unknown.
 */
function snapshotNewAccount(
  session: PasswordSession,
  email: string,
): SessionAccount {
  const account = sessionDataToSessionAccount(
    session.session,
    session.session.service,
  )
  if (!account) {
    throw Error('Expected an active session')
  }
  return {
    ...account,
    email: account.email ?? email,
    emailConfirmed: account.emailConfirmed ?? false,
    emailAuthFactor: account.emailAuthFactor ?? false,
    active: account.active ?? true,
  }
}

function savePersonalDetails(client: Client, birthDate: Date) {
  return retryPostSignupTask('set birthDate', 3, () =>
    client.call(setPersonalDetails, {birthDate}),
  )
}

function initializeProfile(
  client: Client,
  {
    handle,
    createdAt,
    isProd,
  }: {
    handle: string
    createdAt: ReturnType<typeof toDatetimeString>
    isProd: boolean
  },
) {
  return retryPostSignupTask('set initial profile', 3, () =>
    client.call(upsertProfile, prev => {
      const next: Partial<app.bsky.actor.profile.Main> = prev || {}
      if (isProd) {
        next.displayName = handle
        next.createdAt = createdAt
      } else {
        next.createdAt = prev?.createdAt || toDatetimeString(new Date())
      }
      return next
    }),
  )
}

function initializeSavedFeeds(client: Client) {
  return retryPostSignupTask('set initial feeds', 1, () =>
    client.call(overwriteSavedFeeds, [
      {...DISCOVER_SAVED_FEED, id: TID.nextStr()},
      {...TIMELINE_SAVED_FEED, id: TID.nextStr()},
    ]),
  )
}

function restrictChatAfterAgeAssurance(
  ageAssurance: Promise<unknown>,
  client: Client,
  did: string,
) {
  return ageAssurance.then(() => {
    const {flags} = unsafeGetAndComputeAgeAssurance({did})
    if (flags?.chatDisabled || flags?.groupChatDisabled) {
      void restrictChatSettings({
        client,
        restrictIncoming: flags.chatDisabled,
        restrictGroupInvites: flags.groupChatDisabled,
      })
    }
  })
}

function retryPostSignupTask<T>(
  description: string,
  retries: number,
  task: () => Promise<T>,
) {
  return networkRetry(retries, task).catch(e => {
    logger.info(`createSessionBundleAndCreateAccount: failed to ${description}`)
    throw e
  })
}

async function reportPostSignupFailures(tasks: Promise<unknown>[]) {
  const results = await Promise.allSettled(tasks)
  if (results.some(result => result.status === 'rejected')) {
    logger.error(
      `session: createSessionBundleAndCreateAccount failed to save post-signup settings`,
    )
  }
}
