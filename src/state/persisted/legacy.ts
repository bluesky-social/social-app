import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {schema, Schema} from '#/state/persisted/schema'
import {write, read} from '#/state/persisted/store'

/**
 * The shape of the serialized data from our legacy Mobx store.
 */
type LegacySchema = {
  shell: {
    colorMode: 'system' | 'light' | 'dark'
  }
  session: {
    data: {
      service: string
      did: `did:plc:${string}`
    }
    accounts: {
      service: string
      did: `did:plc:${string}`
      refreshJwt: string
      accessJwt: string
      handle: string
      email: string
      displayName: string
      aviUrl: string
      emailConfirmed: boolean
    }[]
  }
  me: {
    did: `did:plc:${string}`
    handle: string
    displayName: string
    description: string
    avatar: string
  }
  onboarding: {
    step: string
  }
  preferences: {
    primaryLanguage: string
    contentLanguages: string[]
    postLanguage: string
    postLanguageHistory: string[]
    contentLabels: {
      nsfw: string
      nudity: string
      suggestive: string
      gore: string
      hate: string
      spam: string
      impersonation: string
    }
    savedFeeds: string[]
    pinnedFeeds: string[]
    requireAltTextEnabled: boolean
  }
  invitedUsers: {
    seenDids: string[]
    copiedInvites: string[]
  }
  mutedThreads: {uris: string[]}
  reminders: {lastEmailConfirm: string}
}

const DEPRECATED_ROOT_STATE_STORAGE_KEY = 'root'

export function transform(legacy: LegacySchema): Schema {
  return {
    colorMode: legacy.shell.colorMode || schema.colorMode,
    accounts: legacy.session.accounts || schema.accounts,
    currentAccount:
      legacy.session.accounts.find(a => a.did === legacy.session.data.did) ||
      schema.currentAccount,
    lastEmailConfirmReminder:
      legacy.reminders.lastEmailConfirm || schema.lastEmailConfirmReminder,
    primaryLanguage:
      legacy.preferences.primaryLanguage || schema.primaryLanguage,
    contentLanguages:
      legacy.preferences.contentLanguages || schema.contentLanguages,
    postLanguage: legacy.preferences.postLanguage || schema.postLanguage,
    postLanguageHistory:
      legacy.preferences.postLanguageHistory || schema.postLanguageHistory,
    requireAltTextEnabled:
      legacy.preferences.requireAltTextEnabled || schema.requireAltTextEnabled,
    mutedThreads: legacy.mutedThreads.uris || schema.mutedThreads,
    invitedUsers: {
      seenDids: legacy.invitedUsers.seenDids || schema.invitedUsers.seenDids,
      copiedInvites:
        legacy.invitedUsers.copiedInvites || schema.invitedUsers.copiedInvites,
    },
    onboarding: {
      step: legacy.onboarding.step || schema.onboarding.step,
    },
  }
}

/**
 * Migrates legacy persisted state to new store if new store doesn't exist in
 * local storage AND old storage exists.
 */
export async function migrate() {
  logger.debug('persisted state: migrate')

  try {
    const rawLegacyData = await AsyncStorage.getItem(
      DEPRECATED_ROOT_STATE_STORAGE_KEY,
    )
    const alreadyMigrated = Boolean(await read())

    if (!alreadyMigrated && rawLegacyData) {
      logger.debug('persisted state: migrating legacy storage')
      const legacyData = JSON.parse(rawLegacyData)
      const newData = transform(legacyData)
      await write(newData)
      logger.debug('persisted state: migrated legacy storage')
    }
  } catch (e) {
    logger.error('persisted state: error migrating legacy storage', {error: e})
  }
}
