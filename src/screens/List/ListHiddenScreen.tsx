import React from 'react'
import {View} from 'react-native'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useGoBack} from '#/lib/hooks/useGoBack'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {RQKEY_ROOT as listQueryRoot} from '#/state/queries/list'
import {useListBlockMutation, useListMuteMutation} from '#/state/queries/list'
import {
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Loader} from '#/components/Loader'
import {useHider} from '#/components/moderation/Hider'
import {Text} from '#/components/Typography'

export function ListHiddenScreen({
  list,
  preferences,
}: {
  list: AppBskyGraphDefs.ListView
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const {gtMobile} = useBreakpoints()
  const isOwner = currentAccount?.did === list.creator.did
  const goBack = useGoBack()
  const queryClient = useQueryClient()

  const isModList = list.purpose === AppBskyGraphDefs.MODLIST

  const [isProcessing, setIsProcessing] = React.useState(false)
  const listBlockMutation = useListBlockMutation()
  const listMuteMutation = useListMuteMutation()
  const {mutateAsync: removeSavedFeed} = useRemoveFeedMutation()

  const {setIsContentVisible} = useHider()

  const savedFeedConfig = preferences.savedFeeds.find(f => f.value === list.uri)

  const onUnsubscribe = async () => {
    setIsProcessing(true)
    if (list.viewer?.muted) {
      try {
        await listMuteMutation.mutateAsync({uri: list.uri, mute: false})
      } catch (e) {
        setIsProcessing(false)
        logger.error('Failed to unmute list', {message: e})
        Toast.show(
          _(
            msg`There was an issue. Please check your internet connection and try again.`,
          ),
        )
        return
      }
    }
    if (list.viewer?.blocked) {
      try {
        await listBlockMutation.mutateAsync({uri: list.uri, block: false})
      } catch (e) {
        setIsProcessing(false)
        logger.error('Failed to unblock list', {message: e})
        Toast.show(
          _(
            msg`There was an issue. Please check your internet connection and try again.`,
          ),
        )
        return
      }
    }
    queryClient.invalidateQueries({
      queryKey: [listQueryRoot],
    })
    Toast.show(_(msg`Unsubscribed from list`))
    setIsProcessing(false)
  }

  const onRemoveList = async () => {
    if (!savedFeedConfig) return
    try {
      await removeSavedFeed(savedFeedConfig)
      Toast.show(_(msg`Removed from saved feeds`))
    } catch (e) {
      logger.error('Failed to remove list from saved feeds', {message: e})
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <CenteredView
      style={[
        a.flex_1,
        a.align_center,
        a.gap_5xl,
        !gtMobile && a.justify_between,
        t.atoms.border_contrast_low,
        {paddingTop: 175, paddingBottom: 110},
      ]}
      sideBorders={true}>
      <View style={[a.w_full, a.align_center, a.gap_lg]}>
        <EyeSlash
          style={{color: t.atoms.text_contrast_medium.color}}
          height={42}
          width={42}
        />
        <View style={[a.gap_sm, a.align_center]}>
          <Text style={[a.font_bold, a.text_3xl]}>
            {list.creator.viewer?.blocking || list.creator.viewer?.blockedBy ? (
              <Trans>Creator has been blocked</Trans>
            ) : (
              <Trans>List has been hidden</Trans>
            )}
          </Text>
          <Text
            style={[
              a.text_md,
              a.text_center,
              a.px_md,
              t.atoms.text_contrast_high,
              {lineHeight: 1.4},
            ]}>
            {list.creator.viewer?.blocking || list.creator.viewer?.blockedBy ? (
              <Trans>
                Either the creator of this list has blocked you or you have
                blocked the creator.
              </Trans>
            ) : (
              <Trans>
                This list - created by{' '}
                <Text style={[a.text_md, !isOwner && a.font_bold]}>
                  {isOwner
                    ? _(msg`you`)
                    : sanitizeHandle(list.creator.handle, '@')}
                </Text>{' '}
                - contains possible violations of Bluesky's community guidelines
                in its name or description.
              </Trans>
            )}
          </Text>
        </View>
      </View>
      <View style={[a.gap_md, gtMobile ? {width: 350} : [a.w_full, a.px_lg]]}>
        <View style={[a.gap_md]}>
          {savedFeedConfig ? (
            <Button
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Remove from saved feeds`)}
              onPress={onRemoveList}
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Removed from saved feeds</Trans>
              </ButtonText>
              {isProcessing ? (
                <ButtonIcon icon={Loader} position="right" />
              ) : null}
            </Button>
          ) : null}
          {isOwner ? (
            <Button
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Show list anyway`)}
              onPress={() => setIsContentVisible(true)}
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Show anyway</Trans>
              </ButtonText>
            </Button>
          ) : list.viewer?.muted || list.viewer?.blocked ? (
            <Button
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Unsubscribe from list`)}
              onPress={() => {
                if (isModList) {
                  onUnsubscribe()
                } else {
                  onRemoveList()
                }
              }}
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Unsubscribe from list</Trans>
              </ButtonText>
              {isProcessing ? (
                <ButtonIcon icon={Loader} position="right" />
              ) : null}
            </Button>
          ) : null}
        </View>
        <Button
          variant="solid"
          color="primary"
          label={_(msg`Return to previous page`)}
          onPress={goBack}
          size="large"
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Go Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </CenteredView>
  )
}
