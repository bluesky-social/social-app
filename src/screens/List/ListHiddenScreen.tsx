import React from 'react'
import {View} from 'react-native'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useGoBack} from 'lib/hooks/useGoBack'
import {isWeb} from 'platform/detection'
import {
  useListBlockMutation,
  useListDeleteMutation,
  useListMuteMutation,
} from 'state/queries/list'
import {
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
} from 'state/queries/preferences'
import {useSession} from 'state/session'
import * as Toast from 'view/com/util/Toast'
import {CenteredView} from 'view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {useScreenHider} from '#/components/moderation/Hider'
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
  const {showInfoDialog} = useScreenHider()
  const goBack = useGoBack()

  const isModList = list.purpose === 'app.bsky.graph.defs#modlist'

  const [isProcessing, setIsProcessing] = React.useState(false)
  const listBlockMutation = useListBlockMutation()
  const listMuteMutation = useListMuteMutation()
  const listDeleteMutation = useListDeleteMutation()
  const {mutateAsync: removeSavedFeed} = useRemoveFeedMutation()

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
    Toast.show(_(msg`Unsubscribed from list`))
    setIsProcessing(false)
  }

  const onDeleteList = async () => {
    setIsProcessing(true)
    try {
      await listDeleteMutation.mutateAsync({uri: list.uri})
      Toast.show(_(msg`List deleted`))
    } catch (e) {
      logger.error('Failed to delete list from saved feeds', {message: e})
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    } finally {
      setIsProcessing(false)
      goBack()
    }
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
      <View style={[a.w_full, a.align_center, a.gap_xl]}>
        <EyeSlash
          style={{color: t.atoms.text_contrast_medium.color}}
          height={42}
          width={42}
        />
        <View style={[a.gap_md, a.align_center]}>
          <Text style={[a.font_bold, a.text_3xl]}>
            <Trans>List hidden</Trans>
          </Text>
          <Text
            style={[
              a.text_md,
              a.text_center,
              a.px_md,
              t.atoms.text_contrast_high,
              {lineHeight: 1.4},
              isWeb && {maxWidth: 450},
            ]}>
            {isOwner ? (
              <Trans>
                The list you are trying to view (
                <Text style={[a.font_bold, a.text_md]}>{list.name}</Text>) has
                been hidden.
              </Trans>
            ) : (
              <Trans>The list you are trying to view has been hidden.</Trans>
            )}{' '}
            <Text
              style={[a.text_md, {color: t.palette.primary_500}]}
              onPress={showInfoDialog}>
              {isWeb ? (
                <Trans>Click here to learn more</Trans>
              ) : (
                <Trans>Tap here to learn more</Trans>
              )}
            </Text>
            .
          </Text>
        </View>
      </View>
      <View style={[a.gap_md, gtMobile ? {width: 350} : [a.w_full, a.px_lg]]}>
        <View style={[a.gap_md]}>
          {savedFeedConfig ? (
            <Button
              variant="solid"
              color="secondary"
              size="medium"
              label={_(msg`Remove from saved feeds`)}
              onPress={onRemoveList}
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Removed from saved feeds</Trans>
              </ButtonText>
            </Button>
          ) : null}
          {isOwner ? (
            <Button
              variant="solid"
              color="secondary"
              size="medium"
              label={_(msg`Delete List`)}
              onPress={onDeleteList}
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Delete list</Trans>
              </ButtonText>
            </Button>
          ) : null}
          {list.viewer?.muted || list.viewer?.blocked ? (
            <Button
              variant="solid"
              color="secondary"
              size="medium"
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
            </Button>
          ) : null}
        </View>
        <Button
          variant="solid"
          color="primary"
          label={_(msg`Return to previous page`)}
          onPress={goBack}
          size="medium"
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Go Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </CenteredView>
  )
}
