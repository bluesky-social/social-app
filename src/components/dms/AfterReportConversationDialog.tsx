import {memo, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {
  useProfileBlockMutationQueue,
  useProfileQuery,
} from '#/state/queries/profile'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

type ReportDialogParams = {
  convoId: string
  did: string
}

/**
 * Dialog shown after a report is submitted, allowing the user to block the
 * reporter and/or leave the conversation.
 */
export const AfterReportConversationDialog = memo(
  function BlockOrLeaveDialogInner({
    control,
    params,
    currentScreen,
  }: {
    control: Dialog.DialogControlProps
    params: ReportDialogParams
    currentScreen: 'list' | 'conversation'
  }): React.ReactNode {
    const {t: l} = useLingui()
    return (
      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={l`Would you like to block this user and/or leave this conversation?`}
          style={[web({maxWidth: 400})]}>
          <DialogInner params={params} currentScreen={currentScreen} />
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    )
  },
)

function DialogInner({
  params,
  currentScreen,
}: {
  params: ReportDialogParams
  currentScreen: 'list' | 'conversation'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const {
    data: profile,
    isPending,
    isError,
  } = useProfileQuery({
    did: params.did,
  })

  return isPending ? (
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
        label={l`Close`}
        onPress={() => control.close()}
        size="large"
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
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const control = Dialog.useDialogContext()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const [actions, setActions] = useState<string[]>(['block', 'leave'])
  const shadow = useProfileShadow(profile)
  const [queueBlock] = useProfileBlockMutationQueue(shadow)

  const handleActionsChange = (newActions: string[]) => {
    const hadBlock = actions.includes('block')
    const hasBlock = newActions.includes('block')

    // If block was just checked, ensure leave is also checked
    if (!hadBlock && hasBlock) {
      if (!newActions.includes('leave')) {
        setActions([...newActions, 'leave'])
      } else {
        setActions(newActions)
      }
    }
    // If block was just unchecked, also uncheck leave
    else if (hadBlock && !hasBlock) {
      setActions(newActions.filter(action => action !== 'leave'))
    }
    // Otherwise, use the new actions as-is (user can toggle leave independently)
    else {
      setActions(newActions)
    }
  }

  const {mutate: leaveConvo} = useLeaveConvo(convoId, {
    onMutate: () => {
      if (currentScreen === 'conversation') {
        navigation.dispatch(
          StackActions.replace('Messages', IS_NATIVE ? {animation: 'pop'} : {}),
        )
      }
    },
    onError: () => {
      Toast.show(l`Could not leave chat`, {
        type: 'error',
      })
    },
  })

  let btnText = l`Done`
  let toastMsg: string | undefined
  if (actions.includes('leave') && actions.includes('block')) {
    btnText = l({
      message: 'Block and leave',
      context: 'button',
      comment: 'After-report action for a conversation',
    })
    toastMsg = l({message: 'Conversation left', context: 'toast'})
  } else if (actions.includes('leave')) {
    btnText = l({
      message: 'Leave conversation',
      context: 'button',
      comment: 'After-report action for a conversation',
    })
    toastMsg = l({message: 'Conversation left', context: 'toast'})
  } else if (actions.includes('block')) {
    // Shouldn't be able to reach this, but here for completeness.
    btnText = l({
      message: 'Block user',
      context: 'button',
      comment: 'After-report action for a conversation',
    })
    toastMsg = l({message: 'User blocked', context: 'toast'})
  }

  const onPressPrimaryAction = () => {
    control.close(() => {
      if (actions.includes('block')) {
        void queueBlock()
      }
      if (actions.includes('leave')) {
        leaveConvo()
      }
      if (toastMsg) {
        Toast.show(toastMsg, {
          type: 'success',
        })
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
        label={l`Block user and/or leave this conversation`}
        values={actions}
        onChange={handleActionsChange}>
        <View style={[a.gap_md]}>
          <Toggle.Item name="block" label={l`Block user`}>
            <Toggle.Checkbox />
            <Toggle.LabelText style={[a.text_md]}>
              <Trans>Block user</Trans>
            </Toggle.LabelText>
          </Toggle.Item>
          <Toggle.Item
            name="leave"
            label={l`Leave conversation`}
            disabled={actions.includes('block')}>
            <Toggle.Checkbox />
            <Toggle.LabelText style={[a.text_md]}>
              <Trans>Leave conversation</Trans>
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
          label={l`Close`}
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
