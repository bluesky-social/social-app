import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs, ToolsOzoneReportDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {BLUESKY_MOD_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function GoLiveDisabledDialog({
  control,
  status,
}: {
  control: Dialog.DialogControlProps
  status: AppBskyActorDefs.StatusView
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner control={control} status={status} />
    </Dialog.Outer>
  )
}

export function DialogInner({
  control,
  status,
}: {
  control: Dialog.DialogControlProps
  status: AppBskyActorDefs.StatusView
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const [details, setDetails] = useState('')

  const {mutate, isPending} = useMutation({
    mutationFn: async () => {
      if (!agent.session?.did) {
        throw new Error('Not logged in')
      }
      if (!status.uri || !status.cid) {
        throw new Error('Status is missing uri or cid')
      }

      if (__DEV__) {
        logger.info('Submitting go live appeal', {
          details,
        })
      } else {
        await agent.createModerationReport(
          {
            reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
            subject: {
              $type: 'com.atproto.repo.strongRef',
              uri: status.uri,
              cid: status.cid,
            },
            reason: details,
          },
          {
            encoding: 'application/json',
            headers: BLUESKY_MOD_SERVICE_HEADERS,
          },
        )
      }
    },
    onError: () => {
      Toast.show(_(msg`Failed to submit appeal, please try again.`), {
        type: 'error',
      })
    },
    onSuccess: () => {
      control.close()
      Toast.show(_(msg({message: 'Appeal submitted', context: 'toast'})), {
        type: 'success',
      })
    },
  })

  const onSubmit = useCallback(() => mutate(), [mutate])

  return (
    <Dialog.ScrollableInner
      label={_(msg`Appeal livestream suspension`)}
      style={[web({maxWidth: 400})]}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_md]}>
          <Text
            style={[
              a.flex_1,
              a.text_2xl,
              a.font_semi_bold,
              a.leading_snug,
              a.pr_4xl,
            ]}>
            <Trans>Going live is currently disabled for your account</Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              You are currently blocked from using the Go Live feature. To
              appeal this moderation decision, please submit the form below.
            </Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              This appeal will be sent to Bluesky's moderation service.
            </Trans>
          </Text>
        </View>

        <View style={[a.gap_md]}>
          <Dialog.Input
            label={_(msg`Text input field`)}
            placeholder={_(
              msg`Please explain why you think your Go Live access was incorrectly disabled.`,
            )}
            value={details}
            onChangeText={setDetails}
            autoFocus={true}
            numberOfLines={3}
            multiline
            maxLength={300}
          />
          <Button
            testID="submitBtn"
            variant="solid"
            color="primary"
            size="large"
            onPress={onSubmit}
            label={_(msg`Submit`)}>
            <ButtonText>{_(msg`Submit`)}</ButtonText>
            {isPending && <ButtonIcon icon={Loader} />}
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
