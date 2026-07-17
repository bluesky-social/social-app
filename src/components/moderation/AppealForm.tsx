import {useState} from 'react'
import {View} from 'react-native'
import {type Service} from '@atproto/lex'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {useLabelSubject} from '#/lib/moderation'
import {useLabelInfo} from '#/lib/moderation/useLabelInfo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {getErrorName, isXrpcError} from '#/lib/xrpc-error'
import {logger} from '#/logger'
import {usePdsClient} from '#/state/session'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {
  accountReportSubject,
  recordReportSubject,
} from '#/components/moderation/ReportDialog/utils/reportSubject'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_ANDROID} from '#/env'
import {com, tools} from '#/lexicons'

export function AppealForm({
  label,
  control,
  onPressBack,
}: {
  label: com.atproto.label.defs.Label
  control: Dialog.DialogOuterProps['control']
  onPressBack: () => void
}) {
  const {_} = useLingui()
  const {labeler, strings} = useLabelInfo(label)
  const {gtMobile} = useBreakpoints()
  const [details, setDetails] = useState('')
  const {subject} = useLabelSubject({label})
  const pdsClient = usePdsClient()
  const sourceName = labeler
    ? sanitizeHandle(labeler.creator.handle, '@')
    : label.src
  const [error, setError] = useState<string | null>(null)

  const {mutate, isPending} = useMutation({
    mutationFn: async () => {
      await pdsClient.call(
        com.atproto.moderation.createReport,
        {
          reasonType: tools.ozone.report.defs.reasonAppeal.value,
          subject:
            'did' in subject
              ? accountReportSubject(subject.did)
              : recordReportSubject(subject.uri, subject.cid),
          reason: details,
        },
        {
          service: `${label.src}#atproto_labeler` as Service,
        },
      )
    },
    onError: err => {
      /* not a declared error of com.atproto.moderation.createReport (which declares none); server sends it anyway */
      if (isXrpcError(err) && getErrorName(err) === 'AlreadyAppealed') {
        setError(
          _(
            msg`You've already appealed this label and it's being reviewed by our moderation team.`,
          ),
        )
      } else {
        setError(_(msg`Failed to submit appeal, please try again.`))
      }
      logger.error('Failed to submit label appeal', {message: err})
    },
    onSuccess: () => {
      control.close()
      Toast.show(_(msg({message: 'Appeal submitted', context: 'toast'})))
    },
  })

  const onSubmit = () => mutate()

  return (
    <>
      <View>
        <Text style={[a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_tight]}>
          <Trans>Appeal "{strings.name}" label</Trans>
        </Text>
        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            This appeal will be sent to{' '}
            <InlineLinkText
              label={sourceName}
              to={makeProfileLink(
                labeler ? labeler.creator : {did: label.src, handle: ''},
              )}
              onPress={() => control.close()}
              style={[a.text_md, a.leading_snug]}>
              {sourceName}
            </InlineLinkText>
            .
          </Trans>
        </Text>
      </View>
      {error && (
        <Admonition type="error" style={[a.mt_sm]}>
          {error}
        </Admonition>
      )}
      <View style={[a.my_md]}>
        <Dialog.Input
          label={_(msg`Text input field`)}
          placeholder={_(
            msg`Please explain why you think this label was incorrectly applied by ${
              labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src
            }`,
          )}
          value={details}
          onChangeText={setDetails}
          autoFocus={true}
          numberOfLines={3}
          multiline
          maxLength={300}
        />
      </View>

      <View
        style={
          gtMobile
            ? [a.flex_row, a.justify_between]
            : [{flexDirection: 'column-reverse'}, a.gap_sm]
        }>
        <Button
          testID="backBtn"
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}
          label={_(msg`Back`)}>
          <ButtonText>{_(msg`Back`)}</ButtonText>
        </Button>
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
      {IS_ANDROID && <View style={{height: 300}} />}
    </>
  )
}
