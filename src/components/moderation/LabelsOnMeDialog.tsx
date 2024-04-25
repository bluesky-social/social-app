import React from 'react'
import {View} from 'react-native'
import {ComAtprotoLabelDefs, ComAtprotoModerationDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useLabelInfo} from '#/lib/moderation/useLabelInfo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useAgent} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {Divider} from '../Divider'

export {useDialogControl as useLabelsOnMeDialogControl} from '#/components/Dialog'

type Subject =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export interface LabelsOnMeDialogProps {
  control: Dialog.DialogOuterProps['control']
  subject: Subject
  labels: ComAtprotoLabelDefs.Label[]
}

export function LabelsOnMeDialogInner(props: LabelsOnMeDialogProps) {
  const {_} = useLingui()
  const [appealingLabel, setAppealingLabel] = React.useState<
    ComAtprotoLabelDefs.Label | undefined
  >(undefined)
  const {subject, labels} = props
  const isAccount = 'did' in subject

  return (
    <Dialog.ScrollableInner
      label={
        isAccount
          ? _(msg`The following labels were applied to your account.`)
          : _(msg`The following labels were applied to your content.`)
      }>
      {appealingLabel ? (
        <AppealForm
          label={appealingLabel}
          subject={subject}
          control={props.control}
          onPressBack={() => setAppealingLabel(undefined)}
        />
      ) : (
        <>
          <Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
            {isAccount ? (
              <Trans>Labels on your account</Trans>
            ) : (
              <Trans>Labels on your content</Trans>
            )}
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              You may appeal these labels if you feel they were placed in error.
            </Trans>
          </Text>

          <View style={[a.py_lg, a.gap_md]}>
            {labels.map(label => (
              <Label
                key={`${label.val}-${label.src}`}
                label={label}
                control={props.control}
                onPressAppeal={label => setAppealingLabel(label)}
              />
            ))}
          </View>
        </>
      )}

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />

      <LabelsOnMeDialogInner {...props} />
    </Dialog.Outer>
  )
}

function Label({
  label,
  control,
  onPressAppeal,
}: {
  label: ComAtprotoLabelDefs.Label
  control: Dialog.DialogOuterProps['control']
  onPressAppeal: (label: ComAtprotoLabelDefs.Label) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {labeler, strings} = useLabelInfo(label)
  return (
    <View
      style={[
        a.border,
        t.atoms.border_contrast_low,
        a.rounded_sm,
        a.overflow_hidden,
      ]}>
      <View style={[a.p_md, a.gap_sm, a.flex_row]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.font_bold, a.text_md]}>{strings.name}</Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            {strings.description}
          </Text>
        </View>
        <View>
          <Button
            variant="solid"
            color="secondary"
            size="small"
            label={_(msg`Appeal`)}
            onPress={() => onPressAppeal(label)}>
            <ButtonText>
              <Trans>Appeal</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>

      <Divider />

      <View style={[a.px_md, a.py_sm, t.atoms.bg_contrast_25]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>Source:</Trans>{' '}
          <InlineLinkText
            to={makeProfileLink(
              labeler ? labeler.creator : {did: label.src, handle: ''},
            )}
            onPress={() => control.close()}>
            {labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src}
          </InlineLinkText>
        </Text>
      </View>
    </View>
  )
}

function AppealForm({
  label,
  subject,
  control,
  onPressBack,
}: {
  label: ComAtprotoLabelDefs.Label
  subject: Subject
  control: Dialog.DialogOuterProps['control']
  onPressBack: () => void
}) {
  const {_} = useLingui()
  const {labeler, strings} = useLabelInfo(label)
  const {gtMobile} = useBreakpoints()
  const [details, setDetails] = React.useState('')
  const isAccountReport = 'did' in subject
  const {getAgent} = useAgent()

  const onSubmit = async () => {
    try {
      const $type = !isAccountReport
        ? 'com.atproto.repo.strongRef'
        : 'com.atproto.admin.defs#repoRef'
      await getAgent()
        .withProxy('atproto_labeler', label.src)
        .createModerationReport({
          reasonType: ComAtprotoModerationDefs.REASONAPPEAL,
          subject: {
            $type,
            ...subject,
          },
          reason: details,
        })
      Toast.show(_(msg`Appeal submitted.`))
    } finally {
      control.close()
    }
  }

  return (
    <>
      <Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
        <Trans>Appeal "{strings.name}" label</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>
        <Trans>
          This appeal will be sent to{' '}
          <InlineLinkText
            to={makeProfileLink(
              labeler ? labeler.creator : {did: label.src, handle: ''},
            )}
            onPress={() => control.close()}
            style={[a.text_md, a.leading_snug]}>
            {labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src}
          </InlineLinkText>
          .
        </Trans>
      </Text>
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
          size="medium"
          onPress={onPressBack}
          label={_(msg`Back`)}>
          <ButtonText>{_(msg`Back`)}</ButtonText>
        </Button>
        <Button
          testID="submitBtn"
          variant="solid"
          color="primary"
          size="medium"
          onPress={onSubmit}
          label={_(msg`Submit`)}>
          <ButtonText>{_(msg`Submit`)}</ButtonText>
        </Button>
      </View>
    </>
  )
}
