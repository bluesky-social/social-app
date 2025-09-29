import {memo, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  type $Typed,
  type AppBskyActorDefs,
  type ChatBskyConvoDefs,
  type ComAtprotoModerationCreateReport,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import {useMutation} from '@tanstack/react-query'
import type React from 'react'

import {BLUESKY_MOD_SERVICE_HEADERS} from '#/lib/constants'
import {type ReportOption} from '#/lib/moderation/useReportOptions'
import {type NavigationProp} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {
  useProfileBlockMutationQueue,
  useProfileQuery,
} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, platform, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronLeft_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {PaperPlane_Stroke2_Corner0_Rounded as SendIcon} from '#/components/icons/PaperPlane'
import {Loader} from '#/components/Loader'
import {SelectReportOptionView} from '#/components/ReportDialog/SelectReportOptionView'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {MessageItemMetadata} from './MessageItem'

type ReportDialogParams = {
  type: 'convoMessage'
  convoId: string
  message: ChatBskyConvoDefs.MessageView
}

let ReportDialog = ({
  control,
  params,
  currentScreen,
}: {
  control: Dialog.DialogControlProps
  params: ReportDialogParams
  currentScreen: 'list' | 'conversation'
}): React.ReactNode => {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Report this message`)}>
        <DialogInner params={params} currentScreen={currentScreen} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
ReportDialog = memo(ReportDialog)
export {ReportDialog}

function DialogInner({
  params,
  currentScreen,
}: {
  params: ReportDialogParams
  currentScreen: 'list' | 'conversation'
}) {
  const {data: profile, isError} = useProfileQuery({
    did: params.message.sender.did,
  })
  const [reportOption, setReportOption] = useState<ReportOption | null>(null)
  const [done, setDone] = useState(false)
  const control = Dialog.useDialogContext()

  return done ? (
    profile ? (
      <DoneStep
        convoId={params.convoId}
        currentScreen={currentScreen}
        profile={profile}
      />
    ) : (
      <View style={[a.w_full, a.py_5xl, a.align_center]}>
        <Loader />
      </View>
    )
  ) : reportOption ? (
    <SubmitStep
      params={params}
      reportOption={reportOption}
      goBack={() => setReportOption(null)}
      onComplete={() => {
        if (isError) {
          control.close()
        } else {
          setDone(true)
        }
      }}
    />
  ) : (
    <ReasonStep params={params} setReportOption={setReportOption} />
  )
}

function ReasonStep({
  setReportOption,
}: {
  setReportOption: (reportOption: ReportOption) => void
  params: ReportDialogParams
}) {
  const control = Dialog.useDialogContext()

  return (
    <SelectReportOptionView
      labelers={[]}
      goBack={control.close}
      params={{
        type: 'convoMessage',
      }}
      onSelectReportOption={setReportOption}
    />
  )
}

function SubmitStep({
  params,
  reportOption,
  goBack,
  onComplete,
}: {
  params: ReportDialogParams
  reportOption: ReportOption
  goBack: () => void
  onComplete: () => void
}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const [details, setDetails] = useState('')
  const agent = useAgent()

  const {
    mutate: submit,
    error,
    isPending: submitting,
  } = useMutation({
    mutationFn: async () => {
      if (params.type === 'convoMessage') {
        const {convoId, message} = params
        const subject: $Typed<ChatBskyConvoDefs.MessageRef> = {
          $type: 'chat.bsky.convo.defs#messageRef',
          messageId: message.id,
          convoId,
          did: message.sender.did,
        }

        const report = {
          reasonType: reportOption.reason,
          subject,
          reason: details,
        } satisfies ComAtprotoModerationCreateReport.InputSchema

        await agent.createModerationReport(report, {
          encoding: 'application/json',
          headers: BLUESKY_MOD_SERVICE_HEADERS,
        })
      }
    },
    onSuccess: onComplete,
  })

  const copy = useMemo(() => {
    return {
      convoMessage: {
        title: _(msg`Report this message`),
      },
    }[params.type]
  }, [_, params])

  return (
    <View style={a.gap_lg}>
      <Button
        size="small"
        variant="solid"
        color="secondary"
        shape="round"
        label={_(msg`Go back to previous step`)}
        onPress={goBack}>
        <ButtonIcon icon={Chevron} />
      </Button>

      <View style={[a.justify_center, gtMobile ? a.gap_sm : a.gap_xs]}>
        <Text style={[a.text_2xl, a.font_semi_bold]}>{copy.title}</Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>
            Your report will be sent to the Bluesky Moderation Service
          </Trans>
        </Text>
      </View>

      {params.type === 'convoMessage' && (
        <PreviewMessage message={params.message} />
      )}

      <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
        <Text
          style={[a.font_semi_bold, a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>Reason:</Trans>
        </Text>{' '}
        <Text style={[a.font_semi_bold, a.text_md]}>{reportOption.title}</Text>
      </Text>

      <Divider />

      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>Optionally provide additional information below:</Trans>
        </Text>

        <View style={[a.relative, a.w_full]}>
          <Dialog.Input
            multiline
            defaultValue={details}
            onChangeText={setDetails}
            label={_(msg`Text field`)}
            style={{paddingRight: 60}}
            numberOfLines={5}
          />
          <View
            style={[
              a.absolute,
              a.flex_row,
              a.align_center,
              a.pr_md,
              a.pb_sm,
              {
                bottom: 0,
                right: 0,
              },
            ]}>
            <CharProgress count={details?.length || 0} />
          </View>
        </View>
      </View>

      <View style={[a.flex_row, a.align_center, a.justify_end, a.gap_lg]}>
        {error && (
          <Text
            style={[
              a.flex_1,
              a.italic,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>
              There was an issue sending your report. Please check your internet
              connection.
            </Trans>
          </Text>
        )}

        <Button
          testID="sendReportBtn"
          size="large"
          variant="solid"
          color="negative"
          label={_(msg`Send report`)}
          onPress={() => submit()}>
          <ButtonText>
            <Trans>Send report</Trans>
          </ButtonText>
          <ButtonIcon icon={submitting ? Loader : SendIcon} />
        </Button>
      </View>
    </View>
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
          StackActions.replace('Messages', isNative ? {animation: 'pop'} : {}),
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
        label={_(msg`Block and/or delete this conversation`)}
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

      <View style={[a.gap_md, web([a.flex_row_reverse])]}>
        <Button
          label={btnText}
          onPress={onPressPrimaryAction}
          size="large"
          variant="solid"
          color={actions.length > 0 ? 'negative' : 'primary'}>
          <ButtonText>{btnText}</ButtonText>
        </Button>
        <Button
          label={_(msg`Close`)}
          onPress={() => control.close()}
          size={platform({native: 'small', web: 'large'})}
          variant={platform({
            native: 'ghost',
            web: 'solid',
          })}
          color="secondary">
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

function PreviewMessage({message}: {message: ChatBskyConvoDefs.MessageView}) {
  const t = useTheme()
  const rt = useMemo(() => {
    return new RichTextAPI({text: message.text, facets: message.facets})
  }, [message.text, message.facets])

  return (
    <View style={a.align_start}>
      <View
        style={[
          a.py_sm,
          a.my_2xs,
          a.rounded_md,
          {
            paddingLeft: 14,
            paddingRight: 14,
            backgroundColor: t.palette.contrast_50,
            borderRadius: 17,
          },
          {borderBottomLeftRadius: 2},
        ]}>
        <RichText
          value={rt}
          style={[a.text_md, a.leading_snug]}
          interactiveStyle={a.underline}
          enableTags
        />
      </View>
      <MessageItemMetadata
        item={{
          type: 'message',
          message,
          key: '',
          nextMessage: null,
          prevMessage: null,
        }}
        style={[a.text_left, a.mb_0]}
      />
    </View>
  )
}
