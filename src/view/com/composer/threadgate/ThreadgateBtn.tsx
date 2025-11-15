import {useEffect, useMemo, useState} from 'react'
import {Keyboard, type StyleProp, type ViewStyle} from 'react-native'
import {type AnimatedStyle} from 'react-native-reanimated'
import {type AppBskyFeedPostgate} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import deepEqual from 'lodash.isequal'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {usePostInteractionSettingsMutation} from '#/state/queries/post-interaction-settings'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  type ThreadgateAllowUISetting,
  threadgateAllowUISettingToAllowRecordValue,
  threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PostInteractionSettingsControlledDialog} from '#/components/dialogs/PostInteractionSettingsDialog'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
import {useThreadgateNudged} from '#/storage/hooks/threadgate-nudged'

export function ThreadgateBtn({
  postgate,
  onChangePostgate,
  threadgateAllowUISettings,
  onChangeThreadgateAllowUISettings,
}: {
  postgate: AppBskyFeedPostgate.Record
  onChangePostgate: (v: AppBskyFeedPostgate.Record) => void

  threadgateAllowUISettings: ThreadgateAllowUISetting[]
  onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void

  style?: StyleProp<AnimatedStyle<ViewStyle>>
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const [threadgateNudged, setThreadgateNudged] = useThreadgateNudged()
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (!threadgateNudged) {
      const timeout = setTimeout(() => {
        setShowTooltip(true)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [threadgateNudged])

  const onDismissTooltip = (visible: boolean) => {
    if (visible) return
    setThreadgateNudged(true)
    setShowTooltip(false)
  }

  const {data: preferences} = usePreferencesQuery()
  const [persist, setPersist] = useState(false)

  const onPress = () => {
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    setShowTooltip(false)
    setThreadgateNudged(true)

    control.open()
  }

  const prefThreadgateAllowUISettings = threadgateRecordToAllowUISetting({
    $type: 'app.bsky.feed.threadgate',
    post: '',
    createdAt: new Date().toISOString(),
    allow: preferences?.postInteractionSettings.threadgateAllowRules,
  })
  const prefPostgate = createPostgateRecord({
    post: '',
    embeddingRules:
      preferences?.postInteractionSettings?.postgateEmbeddingRules || [],
  })

  const isDirty = useMemo(() => {
    const everybody = [{type: 'everybody'}]
    return (
      !deepEqual(
        threadgateAllowUISettings,
        prefThreadgateAllowUISettings ?? everybody,
      ) ||
      !deepEqual(postgate.embeddingRules, prefPostgate?.embeddingRules ?? [])
    )
  }, [
    prefThreadgateAllowUISettings,
    prefPostgate,
    threadgateAllowUISettings,
    postgate,
  ])

  const {mutate: persistChanges, isPending: isSaving} =
    usePostInteractionSettingsMutation({
      onError: err => {
        if (!isNetworkError(err)) {
          logger.error('Failed to persist threadgate settings', {
            safeMessage: err,
          })
        }
      },
      onSettled: () => {
        control.close(() => {
          setPersist(false)
        })
      },
    })

  const anyoneCanReply =
    threadgateAllowUISettings.length === 1 &&
    threadgateAllowUISettings[0].type === 'everybody'
  const anyoneCanQuote =
    !postgate.embeddingRules || postgate.embeddingRules.length === 0
  const anyoneCanInteract = anyoneCanReply && anyoneCanQuote
  const label = anyoneCanInteract
    ? _(msg`Anyone can interact`)
    : _(msg`Interaction limited`)

  return (
    <>
      <Tooltip.Outer
        visible={showTooltip}
        onVisibleChange={onDismissTooltip}
        position="top">
        <Tooltip.Target>
          <Button
            color={showTooltip ? 'primary_subtle' : 'secondary'}
            size="small"
            testID="openReplyGateButton"
            onPress={onPress}
            label={label}
            accessibilityHint={_(
              msg`Opens a dialog to choose who can interact with this post`,
            )}>
            <ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
            <ButtonText numberOfLines={1}>{label}</ButtonText>
            <ButtonIcon icon={TinyChevronIcon} size="2xs" />
          </Button>
        </Tooltip.Target>
        <Tooltip.TextBubble>
          <Text>
            <Trans>Psst! You can edit who can interact with this post.</Trans>
          </Text>
        </Tooltip.TextBubble>
      </Tooltip.Outer>

      <PostInteractionSettingsControlledDialog
        control={control}
        onSave={() => {
          if (persist) {
            persistChanges({
              threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(
                threadgateAllowUISettings,
              ),
              postgateEmbeddingRules: postgate.embeddingRules ?? [],
            })
          } else {
            control.close()
          }
        }}
        isSaving={isSaving}
        postgate={postgate}
        onChangePostgate={onChangePostgate}
        threadgateAllowUISettings={threadgateAllowUISettings}
        onChangeThreadgateAllowUISettings={onChangeThreadgateAllowUISettings}
        isDirty={isDirty}
        persist={persist}
        onChangePersist={setPersist}
      />
    </>
  )
}
