import {useState} from 'react'
import {View} from 'react-native'
import {XrpcResponseError} from '@atproto/lex'
import {type AtUriString, type DidString} from '@atproto/syntax'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {useLabelSubject} from '#/lib/moderation'
import {useLabelInfo} from '#/lib/moderation/useLabelInfo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useAppviewClient} from '#/state/session'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
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
  const isAccountReport = 'did' in subject
  const client = useAppviewClient()
  const sourceName = labeler
    ? sanitizeHandle(labeler.creator.handle, '@')
    : label.src
  const [error, setError] = useState<string | null>(null)

  const {mutate, isPending} = useMutation({
    mutationFn: async () => {
      await client.call(
        com.atproto.moderation.createReport,
        {
          reasonType: tools.ozone.report.defs.reasonAppeal.value,
          /*
           * `useLabelSubject` derives one shape or the other from the label's
           * `cid`: an at-uri plus cid for a record, or the label's `uri` reused
           * as the account did.
           */
          subject: isAccountReport
            ? {
                $type: 'com.atproto.admin.defs#repoRef',
                did: subject.did as DidString,
              }
            : {
                $type: 'com.atproto.repo.strongRef',
                uri: subject.uri as AtUriString,
                cid: subject.cid,
              },
          reason: details,
        },
        // the appeal goes to the labeler that applied the label
        {service: `${label.src}#atproto_labeler`},
      )
    },
    onError: err => {
      /*
       * `AlreadyAppealed` is real server behavior that createReport's lexicon
       * does NOT declare, so `matchXrpcError` cannot see it and the raw error
       * code is checked instead. Worth an upstream PR to declare it.
       */
      if (err instanceof XrpcResponseError && err.error === 'AlreadyAppealed') {
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
