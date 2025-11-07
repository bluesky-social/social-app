import {useMemo, useState} from 'react'
import {Keyboard, type StyleProp, type ViewStyle} from 'react-native'
import {type AnimatedStyle} from 'react-native-reanimated'
import {type AppBskyFeedPostgate} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'
import deepEqual from 'lodash.isequal'

import {isNative} from '#/platform/detection'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  type ThreadgateAllowUISetting,
  threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PostInteractionSettingsControlledDialog} from '#/components/dialogs/PostInteractionSettingsDialog'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
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
  const {data: preferences} = usePreferencesQuery()
  const [persist, setPersist] = useState(false)

  const onPress = () => {
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    control.open()
  }

  const defaultThreadgateAllowUISettings = threadgateRecordToAllowUISetting({
    $type: 'app.bsky.feed.threadgate',
    post: '',
    createdAt: new Date().toISOString(),
    allow: preferences?.postInteractionSettings.threadgateAllowRules,
  })
  const defaultPostgate = createPostgateRecord({
    post: '',
    embeddingRules:
      preferences?.postInteractionSettings?.postgateEmbeddingRules || [],
  })

  const isDirty = useMemo(() => {
    const everybody = [{type: 'everybody'}]
    return (
      !deepEqual(
        threadgateAllowUISettings,
        defaultThreadgateAllowUISettings ?? everybody,
      ) ||
      !deepEqual(postgate.embeddingRules, defaultPostgate?.embeddingRules ?? [])
    )
  }, [
    defaultThreadgateAllowUISettings,
    defaultPostgate,
    threadgateAllowUISettings,
    postgate,
  ])

  const {mutate: persistChanges} = useMutation({
    mutationFn: async () => {},
  })

  const anyoneCanReply =
    threadgateAllowUISettings.length === 1 &&
    threadgateAllowUISettings[0].type === 'everybody'
  const anyoneCanQuote =
    !postgate.embeddingRules || postgate.embeddingRules.length === 0
  const anyoneCanInteract = anyoneCanReply && anyoneCanQuote
  const label = anyoneCanInteract
    ? _(msg`Anybody can interact`)
    : _(msg`Interaction limited`)

  return (
    <>
      <Button
        color="secondary"
        size="small"
        testID="openReplyGateButton"
        onPress={onPress}
        label={label}
        accessibilityHint={_(
          msg`Opens a dialog to choose who can reply to this thread`,
        )}>
        <ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
        <ButtonText numberOfLines={1}>{label}</ButtonText>
        <ButtonIcon icon={ChevronDownIcon} size="xs" />
      </Button>
      <PostInteractionSettingsControlledDialog
        control={control}
        onSave={() => {
          if (persist) {
            persistChanges()
          } else {
            control.close()
          }
        }}
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
