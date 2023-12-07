import type {LegacySchema} from '#/state/persisted/legacy'

export const ALICE_DID = 'did:plc:ALICE_DID'
export const BOB_DID = 'did:plc:BOB_DID'

export const LEGACY_DATA_DUMP: LegacySchema = {
  session: {
    data: {
      service: 'https://bsky.social/',
      did: ALICE_DID,
    },
    accounts: [
      {
        service: 'https://bsky.social',
        did: ALICE_DID,
        refreshJwt: 'refreshJwt',
        accessJwt: 'accessJwt',
        handle: 'alice.test',
        email: 'alice@bsky.test',
        displayName: 'Alice',
        aviUrl: 'avi',
        emailConfirmed: true,
      },
      {
        service: 'https://bsky.social',
        did: BOB_DID,
        refreshJwt: 'refreshJwt',
        accessJwt: 'accessJwt',
        handle: 'bob.test',
        email: 'bob@bsky.test',
        displayName: 'Bob',
        aviUrl: 'avi',
        emailConfirmed: true,
      },
    ],
  },
  me: {
    did: ALICE_DID,
    handle: 'alice.test',
    displayName: 'Alice',
    description: '',
    avatar: 'avi',
  },
  onboarding: {step: 'Home'},
  shell: {colorMode: 'system'},
  preferences: {
    primaryLanguage: 'en',
    contentLanguages: ['en'],
    postLanguage: 'en',
    postLanguageHistory: ['en', 'en', 'ja', 'pt', 'de', 'en'],
    contentLabels: {
      nsfw: 'warn',
      nudity: 'warn',
      suggestive: 'warn',
      gore: 'warn',
      hate: 'hide',
      spam: 'hide',
      impersonation: 'warn',
    },
    savedFeeds: ['feed_a', 'feed_b', 'feed_c'],
    pinnedFeeds: ['feed_a', 'feed_b'],
    requireAltTextEnabled: false,
  },
  invitedUsers: {seenDids: [], copiedInvites: []},
  mutedThreads: {uris: []},
  reminders: {},
}
