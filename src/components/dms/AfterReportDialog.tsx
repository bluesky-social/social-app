import {memo, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs, type ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import type React from 'react'

import {type NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {
  useProfileBlockMutationQueue,
  useProfileQuery,
} from '#/state/queries/profile'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, platform, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

type ReportDialogParams = {
  convoId: string
  message: ChatBskyConvoDefs.MessageView
}

/**
 * Dialog shown after a report is submitted, allowing the user to block the
 * reporter and/or leave the conversation.
 */
export const AfterReportDialog = memo(function BlockOrDeleteDialogInner({
  control,
  params,
  currentScreen,
}: {
  control: Dialog.DialogControlProps
  params: ReportDialogParams
  currentScreen: 'list' | 'conversation'
}): React.ReactNode {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(
          msg`Would you like to block this user and/or delete this conversation?`,
        )}
        style={[web({maxWidth: 400})]}>
        <DialogInner params={params} currentScreen={currentScreen} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
})

function DialogInner({
  params,
  currentScreen,
}: {
  params: ReportDialogParams
  currentScreen: 'list' | 'conversation'
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const {
    data: profile,
    isLoading,
    isError,
  } = useProfileQuery({
    did: params.message.sender.did,
  })

  return isLoading ? (
    <View style={[a.w_full, a.py_5xl, a.align_center]}>
      <Loader size="lg" />
    </View>
  ) : isError || !profile ? (
    <View style={[a.w_full, a.gap_lg]}>
      <View style={[a.justify_center, a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_semi_bold]}>
          <Trans>Report submitted</Trans>
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>Our moderation team has received your report.</Trans>
        </Text>
      </View>

      <Button
        label={_(msg`Close`)}
        onPress={() => control.close()}
        size={platform({native: 'small', web: 'large'})}
        color="secondary">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </View>
  ) : (
    <DoneStep
      convoId={params.convoId}
      currentScreen={currentScreen}
      profile={profile}
    />
  )
}

function DoneStep({
  convoId,
  currentScreen,
  profile,
}: {
  convoId: string
  currentScreen: 'list' | 'conversation'
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const control = Dialog.useDialogContext()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const [actions, setActions] = useState<string[]>(['block', 'leave'])
  const shadow = useProfileShadow(profile)
  const [queueBlock] = useProfileBlockMutationQueue(shadow)

  const {mutate: leaveConvo} = useLeaveConvo(convoId, {
    onMutate: () => {
      if (currentScreen === 'conversation') {
        navigation.dispatch(
          StackActions.replace('Messages', IS_NATIVE ? {animation: 'pop'} : {}),
        )
      }
    },
    onError: () => {
      Toast.show(_(msg`Could not leave chat`), 'xmark')
    },
  })

  let btnText = _(msg`Done`)
  let toastMsg: string | undefined
  if (actions.includes('leave') && actions.includes('block')) {
    btnText = _(msg`Block and Delete`)
    toastMsg = _(msg({message: 'Conversation deleted', context: 'toast'}))
  } else if (actions.includes('leave')) {
    btnText = _(msg`Delete Conversation`)
    toastMsg = _(msg({message: 'Conversation deleted', context: 'toast'}))
  } else if (actions.includes('block')) {
    btnText = _(msg`Block User`)
    toastMsg = _(msg({message: 'User blocked', context: 'toast'}))
  }

  const onPressPrimaryAction = () => {
    control.close(() => {
      if (actions.includes('block')) {
        queueBlock()
      }
      if (actions.includes('leave')) {
        leaveConvo()
      }
      if (toastMsg) {
        Toast.show(toastMsg, 'check')
      }
    })
  }

  return (
    <View style={a.gap_2xl}>
      <View style={[a.justify_center, gtMobile ? a.gap_sm : a.gap_xs]}>
        <Text style={[a.text_2xl, a.font_semi_bold]}>
          <Trans>Report submitted</Trans>
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>Our moderation team has received your report.</Trans>
        </Text>
      </View>
      <Toggle.Group
        label={_(msg`Block user and/or delete this conversation`)}
        values={actions}
        onChange={setActions}>
        <View style={[a.gap_md]}>
          <Toggle.Item name="block" label={_(msg`Block user`)}>
            <Toggle.Checkbox />
            <Toggle.LabelText style={[a.text_md]}>
              <Trans>Block user</Trans>
            </Toggle.LabelText>
          </Toggle.Item>
          <Toggle.Item name="leave" label={_(msg`Delete conversation`)}>
            <Toggle.Checkbox />
            <Toggle.LabelText style={[a.text_md]}>
              <Trans>Delete conversation</Trans>
            </Toggle.LabelText>
          </Toggle.Item>
        </View>
      </Toggle.Group>

      <View style={[a.gap_sm]}>
        <Button
          label={btnText}
          onPress={onPressPrimaryAction}
          size="large"
          color={actions.length > 0 ? 'negative' : 'primary'}>
          <ButtonText>{btnText}</ButtonText>
        </Button>
        <Button
          label={_(msg`Close`)}
          onPress={() => control.close()}
          size="large"
          color="secondary">
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
