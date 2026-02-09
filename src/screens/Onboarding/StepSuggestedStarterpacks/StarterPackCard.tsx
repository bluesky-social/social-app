import {useState} from 'react'
import {View} from 'react-native'
import {type AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {batchedUpdates} from '#/lib/batchedUpdates'
import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {logger} from '#/logger'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {getAllListMembers} from '#/state/queries/list-members'
import {useAgent, useSession} from '#/state/session'
import {bulkWriteFollows} from '#/screens/Onboarding/util'
import {AvatarStack} from '#/screens/Search/components/StarterPackCard'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import * as bsky from '#/types/bsky'

const IGNORED_ACCOUNT = 'did:plc:pifkcjimdcfwaxkanzhwxufp'

export function StarterPackCard({
  view,
}: {
  view: AppBskyGraphDefs.StarterPackView
}) {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const {gtPhone} = useBreakpoints()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const record = view.record
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFollowingAll, setIsFollowingAll] = useState(false)

  const onFollowAll = async () => {
    if (!view.list) return

    setIsProcessing(true)

    let listItems: AppBskyGraphDefs.ListItemView[] = []
    try {
      listItems = await getAllListMembers(agent, view.list.uri)
    } catch (e) {
      setIsProcessing(false)
      Toast.show(_(msg`An error occurred while trying to follow all`), {
        type: 'error',
      })
      logger.error('Failed to get list members for starter pack', {
        safeMessage: e,
      })
      return
    }

    const dids = listItems
      .filter(
        li =>
          li.subject.did !== IGNORED_ACCOUNT &&
          li.subject.did !== currentAccount?.did &&
          !isBlockedOrBlocking(li.subject) &&
          !isMuted(li.subject) &&
          !li.subject.viewer?.following,
      )
      .map(li => li.subject.did)

    let followUris: Map<string, string>
    try {
      followUris = await bulkWriteFollows(agent, dids, {
        uri: view.uri,
        cid: view.cid,
      })
    } catch (e) {
      setIsProcessing(false)
      Toast.show(_(msg`An error occurred while trying to follow all`), {
        type: 'error',
      })
      logger.error('Failed to follow all accounts', {safeMessage: e})
    }

    setIsFollowingAll(true)
    setIsProcessing(false)
    batchedUpdates(() => {
      for (let did of dids) {
        updateProfileShadow(queryClient, did, {
          followingUri: followUris.get(did),
        })
      }
    })
    Toast.show(_(msg`All accounts have been followed!`), {type: 'success'})
    ax.metric('starterPack:followAll', {
      logContext: 'Onboarding',
      starterPack: view.uri,
      count: dids.length,
    })
  }

  if (
    !bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
      record,
      AppBskyGraphStarterpack.isRecord,
    )
  ) {
    return null
  }

  const profileCount = gtPhone ? 11 : 8
  const profiles = view.listItemsSample
    ?.slice(0, profileCount)
    .map(item => item.subject)

  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.gap_md,
        a.border,
        a.rounded_lg,
        a.overflow_hidden,
        t.atoms.border_contrast_medium,
      ]}>
      <AvatarStack
        profiles={profiles ?? []}
        numPending={profileCount}
        total={view.list?.listItemCount}
      />

      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_end,
          a.gap_lg,
          web({
            position: 'static',
            zIndex: 'unset',
          }),
        ]}>
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            emoji
            style={[a.text_md, a.font_semi_bold, a.leading_snug]}
            numberOfLines={1}>
            {record.name}
          </Text>
          <Text
            emoji
            style={[a.text_xs, t.atoms.text_contrast_medium, a.leading_snug]}
            numberOfLines={2}>
            {record.description}
          </Text>
        </View>
        <Button
          label={_(msg`Follow all`)}
          disabled={isProcessing || isFollowingAll}
          onPress={onFollowAll}
          color="secondary"
          size="small"
          style={[a.z_50]}>
          <ButtonText>
            <Trans>Follow all</Trans>
          </ButtonText>
          {isFollowingAll ? (
            <ButtonIcon icon={CheckIcon} />
          ) : (
            isProcessing && <ButtonIcon icon={Loader} />
          )}
        </Button>
      </View>
    </View>
  )
}
