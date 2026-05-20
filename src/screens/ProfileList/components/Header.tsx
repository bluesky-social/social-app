import {useMemo} from 'react'
import {View} from 'react-native'
import {AppBskyGraphDefs, RichText as RichTextAPI} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {makeListLink} from '#/lib/routes/links'
import {logger} from '#/logger'
import {useListBlockMutation, useListMuteMutation} from '#/state/queries/list'
import {
  useAddSavedFeedsMutation,
  type UsePreferencesQueryResponse,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {ProfileSubpageHeader} from '#/view/com/profile/ProfileSubpageHeader'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Loader} from '#/components/Loader'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {MoreOptionsMenu} from './MoreOptionsMenu'
import {SubscribeMenu} from './SubscribeMenu'

export function Header({
  rkey,
  list,
  preferences,
}: {
  rkey: string
  list: AppBskyGraphDefs.ListView
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isModList = list.purpose === AppBskyGraphDefs.MODLIST
  const isBlocking = !!list.viewer?.blocked
  const isMuting = !!list.viewer?.muted
  const playHaptic = useHaptics()

  const {mutateAsync: muteList, isPending: isMutePending} =
    useListMuteMutation()
  const {mutateAsync: blockList, isPending: isBlockPending} =
    useListBlockMutation()
  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const {mutateAsync: updateSavedFeeds, isPending: isUpdatingSavedFeeds} =
    useUpdateSavedFeedsMutation()

  const isPending = isAddSavedFeedPending || isUpdatingSavedFeeds

  const savedFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === list.uri,
  )
  const isPinned = Boolean(savedFeedConfig?.pinned)

  const onTogglePinned = async () => {
    playHaptic()

    try {
      if (savedFeedConfig) {
        const pinned = !savedFeedConfig.pinned
        await updateSavedFeeds([
          {
            ...savedFeedConfig,
            pinned,
          },
        ])
        Toast.show(
          pinned
            ? _(msg`Pinned to your feeds`)
            : _(msg`Unpinned from your feeds`),
        )
      } else {
        await addSavedFeeds([
          {
            type: 'list',
            value: list.uri,
            pinned: true,
          },
        ])
        Toast.show(_(msg`Saved to your feeds`))
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), {
        type: 'error',
      })
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  const onUnsubscribeMute = async () => {
    try {
      await muteList({uri: list.uri, mute: false})
      Toast.show(_(msg({message: 'List unmuted', context: 'toast'})))
      ax.metric('moderation:unsubscribedFromList', {listType: 'mute'})
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }

  const onUnsubscribeBlock = async () => {
    try {
      await blockList({uri: list.uri, block: false})
      Toast.show(_(msg({message: 'List unblocked', context: 'toast'})))
      ax.metric('moderation:unsubscribedFromList', {listType: 'block'})
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }

  const descriptionRT = useMemo(
    () =>
      list.description
        ? new RichTextAPI({
            text: list.description,
            facets: list.descriptionFacets,
          })
        : undefined,
    [list],
  )

  return (
    <>
      <ProfileSubpageHeader
        href={makeListLink(list.creator.handle || list.creator.did || '', rkey)}
        title={list.name}
        avatar={list.avatar}
        isOwner={list.creator.did === currentAccount?.did}
        creator={list.creator}
        purpose={list.purpose}
        avatarType="list">
        {isCurateList ? (
          <Button
            testID={isPinned ? 'unpinBtn' : 'pinBtn'}
            color={isPinned ? 'secondary' : 'primary_subtle'}
            label={isPinned ? _(msg`Unpin`) : _(msg`Pin to home`)}
            onPress={onTogglePinned}
            disabled={isPending}
            size="small"
            style={[a.rounded_full]}>
            {!isPinned && <ButtonIcon icon={isPending ? Loader : PinIcon} />}
            <ButtonText>
              {isPinned ? <Trans>Unpin</Trans> : <Trans>Pin to home</Trans>}
            </ButtonText>
          </Button>
        ) : isModList ? (
          isBlocking ? (
            <Button
              testID="unblockBtn"
              color="secondary"
              label={_(msg`Unblock`)}
              onPress={onUnsubscribeBlock}
              size="small"
              style={[a.rounded_full]}
              disabled={isBlockPending}>
              {isBlockPending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Unblock</Trans>
              </ButtonText>
            </Button>
          ) : isMuting ? (
            <Button
              testID="unmuteBtn"
              color="secondary"
              label={_(msg`Unmute`)}
              onPress={onUnsubscribeMute}
              size="small"
              style={[a.rounded_full]}
              disabled={isMutePending}>
              {isMutePending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Unmute</Trans>
              </ButtonText>
            </Button>
          ) : (
            <SubscribeMenu list={list} />
          )
        ) : null}
        <MoreOptionsMenu list={list} />
      </ProfileSubpageHeader>
      {descriptionRT ? (
        <View style={[a.px_lg, a.pt_sm, a.pb_sm, a.gap_md]}>
          <RichText value={descriptionRT} style={[a.text_md]} />
        </View>
      ) : null}
    </>
  )
}
