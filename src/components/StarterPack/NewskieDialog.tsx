import React from 'react'
import {Pressable, View} from 'react-native'
import {AppBskyActorDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from 'lib/constants'
import {isNative} from 'platform/detection'
import {useSession} from 'state/session'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Newskie} from '#/components/icons/Newskie'
import {StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {Text} from '#/components/Typography'

const mockSP = {
  uri: 'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.starterpack/3kuec35ms422t',
  cid: 'bafyreigrvmj3qd4urr5q6lqku7uzj4xmazepik6oobuxtvunx3g7d6e6xi',
  record: {
    list: 'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.list/3kuec35kvkj2t',
    name: 'Test 123',
    $type: 'app.bsky.graph.starterpack',
    feeds: [],
    createdAt: '2024-06-07T19:43:07.211Z',
    description: 'Test123',
    descriptionFacets: [],
  },
  creator: {
    did: 'did:plc:t5nrviyjxkdhd5ymyra772dm',
    handle: 'alice.test',
    displayName: 'Alice',
    associated: {
      chat: {
        allowIncoming: 'following',
      },
    },
    viewer: {
      muted: false,
      blockedBy: false,
    },
    labels: [],
  },
  feedCount: 0,
  joinedAllTimeCount: 0,
  joinedWeekCount: 0,
  listItemCount: 2,
  labels: [],
  indexedAt: '2024-06-07T19:43:07.211Z',
  feeds: [],
  list: {
    uri: 'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.list/3kuec35kvkj2t',
    cid: 'bafyreibnigtususbzhjzadhsqconcf7s5wan6dl7h6s56jhxd6ebfvflrq',
    name: 'Test 123',
    purpose: 'app.bsky.graph.defs#referencelist',
    indexedAt: '2024-06-07T19:43:07.122Z',
    labels: [],
    viewer: {
      muted: false,
    },
  },
  listItemsSample: [
    {
      uri: 'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.listitem/3kuec35m2o22t',
      subject: {
        did: 'did:plc:5warwwnoavxfhchjhcjlqyqi',
        handle: 'bob.test',
        displayName: 'Bob',
        viewer: {
          muted: false,
          blockedBy: false,
          following:
            'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.follow/3kudwno6ck22t',
          followedBy:
            'at://did:plc:5warwwnoavxfhchjhcjlqyqi/app.bsky.graph.follow/3kudwno6nbs2t',
        },
        labels: [],
        description: 'Test user 2',
        indexedAt: '2024-06-07T16:18:43.414Z',
      },
    },
    {
      uri: 'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.listitem/3kuec35m2nz2t',
      subject: {
        did: 'did:plc:cvdwnci2mr5srh4slty7lndz',
        handle: 'carla.test',
        displayName: 'Carla',
        viewer: {
          muted: false,
          blockedBy: false,
          following:
            'at://did:plc:t5nrviyjxkdhd5ymyra772dm/app.bsky.graph.follow/3kudwno6hgc2t',
          followedBy:
            'at://did:plc:cvdwnci2mr5srh4slty7lndz/app.bsky.graph.follow/3kudwno6x2c2t',
        },
        labels: [],
        description: 'Test user 3',
        indexedAt: '2024-06-07T16:18:43.462Z',
      },
    },
  ],
}

export function NewskieDialog({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_} = useLingui()
  const control = useDialogControl()

  const profileName = profile.displayName || `@${profile.handle}`
  // const joinedVia = profile.joinedViaStarterPack
  const {currentAccount} = useSession()

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Open new user info dialog`)}
        accessibilityHint={_(
          msg`Opens a dialog with information about the new user`,
        )}
        hitSlop={HITSLOP_10}
        onPress={control.open}>
        <Newskie size={22} />
      </Pressable>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={_(msg`New user info dialog`)}>
          <View style={[a.gap_md, isNative && {marginBottom: 40}]}>
            <Text style={[a.font_bold, a.text_xl]}>
              <Trans>{profileName} is new here!</Trans>
            </Text>
            <Text style={[a.text_md]}>
              {AppBskyGraphStarterpack.isRecord(mockSP.record) ? (
                <Trans>
                  {profileName} joined Bluesky 3 days ago with{' '}
                  {mockSP?.creator.did === currentAccount?.did
                    ? 'your'
                    : `${mockSP?.creator.displayName}'s` ||
                      `@${mockSP?.creator.handle}'s`}{' '}
                  starter pack.
                </Trans>
              ) : (
                <Trans>{profileName} recently joined Bluesky 3 days ago</Trans>
              )}
            </Text>
            <StarterPackCard starterPack={mockSP} type="dialog" />
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
