import React, {useMemo, useState} from 'react'
import {View} from 'react-native'
import {RichText as RichTextAPI} from '@atproto/api'
import {
  ChatBskyConvoDefs,
  ComAtprotoModerationCreateReport,
  ComAtprotoModerationDefs,
} from '@atproto-labs/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {isAndroid} from '#/platform/detection'
import {useAgent} from '#/state/session'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Button, ButtonIcon, ButtonText} from '../Button'
import {Divider} from '../Divider'
import {Loader} from '../Loader'
import {RichText} from '../RichText'
import {Text} from '../Typography'
import {MessageItemMetadata} from './MessageItem'

export function MessageReportDialog({
  control,
  message,
}: {
  control: Dialog.DialogControlProps
  message: ChatBskyConvoDefs.MessageView
}) {
  return (
    <Dialog.Outer
      control={control}
      nativeOptions={isAndroid ? {sheet: {snapPoints: ['100%']}} : {}}>
      <Dialog.Handle />
      <DialogInner message={message} />
    </Dialog.Outer>
  )
}

function DialogInner({message}: {message: ChatBskyConvoDefs.MessageView}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const [details, setDetails] = useState('')
  const control = Dialog.useDialogContext()
  const {getAgent} = useAgent()

  const {
    mutate: submit,
    error,
    isPending: submitting,
  } = useMutation({
    mutationFn: async () => {
      const report = {
        reasonType: ComAtprotoModerationDefs.REASONOTHER,
        subject: {
          $type: 'chat.bsky.convo.defs#messageRef',
          messageId: message.id,
          did: message.sender!.did,
        } satisfies ChatBskyConvoDefs.MessageRef,
        reason: details,
      } satisfies ComAtprotoModerationCreateReport.InputSchema

      await getAgent().createModerationReport(report)
    },
    onSuccess: () => {
      control.close(() => {
        Toast.show(_(msg`Thank you. Your report has been sent.`))
      })
    },
  })

  return (
    <Dialog.ScrollableInner label={_(msg`Report this message`)}>
      <View style={a.gap_lg}>
        <View style={[a.justify_center, gtMobile ? a.gap_sm : a.gap_xs]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Report this message</Trans>
          </Text>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>
              Your report will be sent to the Bluesky Moderation Service
            </Trans>
          </Text>
        </View>

        <PreviewMessage message={message} />

        <Divider />

        <View style={[a.gap_md]}>
          <Text style={[t.atoms.text_contrast_medium]}>
            <Trans>Optionally provide additional information below:</Trans>
          </Text>

          <View style={[a.relative, a.w_full]}>
            <Dialog.Input
              multiline
              value={details}
              onChangeText={setDetails}
              label="Text field"
              style={{paddingRight: 60}}
              numberOfLines={6}
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
                There was an issue sending your report. Please check your
                internet connection.
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
            {submitting && <ButtonIcon icon={Loader} />}
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
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
        message={message}
        isLastInGroup
        style={a.text_left}
      />
    </View>
  )
}
