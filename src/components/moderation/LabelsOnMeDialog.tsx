import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ComAtprotoLabelDefs, ComAtprotoModerationDefs} from '@atproto/api'

import {useLabelInfo} from '#/lib/moderation/useLabelInfo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {getAgent} from '#/state/session'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {Button, ButtonText} from '#/components/Button'
import {InlineLink} from '#/components/Link'
import * as Toast from '#/view/com/util/Toast'

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
  const {gtMobile} = useBreakpoints()
  const [appealingLabel, setAppealingLabel] = React.useState<
    ComAtprotoLabelDefs.Label | undefined
  >(undefined)
  const {subject, labels} = props
  const isAccount = 'did' in subject

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title">
      {appealingLabel ? (
        <AppealForm
          label={appealingLabel}
          subject={subject}
          control={props.control}
          onPressBack={() => setAppealingLabel(undefined)}
        />
      ) : (
        <>
          <Text
            nativeID="dialog-title"
            style={[a.text_2xl, a.font_bold, a.pb_md, a.leading_tight]}>
            {isAccount ? (
              <Trans>Labels on your account</Trans>
            ) : (
              <Trans>Labels on your content</Trans>
            )}
          </Text>
          <Text
            nativeID="dialog-description"
            style={[a.text_sm, a.leading_snug]}>
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

          <View style={gtMobile && [a.flex_row, a.justify_end]}>
            <Button
              testID="doneBtn"
              variant="outline"
              color="primary"
              size="small"
              onPress={() => props.control.close()}
              label={_(msg`Done`)}>
              {_(msg`Done`)}
            </Button>
          </View>
        </>
      )}
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
      key={`${label.src}-${label.val}`}
      style={[
        a.p_md,
        a.rounded_sm,
        a.border,
        t.atoms.border_contrast_low,
        a.gap_sm,
        a.flex_row,
      ]}>
      <View style={[a.flex_1, a.gap_xs]}>
        <Text style={[a.font_bold, a.text_md, t.atoms.text]}>
          {strings.name}
        </Text>
        <Text style={[t.atoms.text]}>{strings.description}</Text>
        <InlineLink
          to={makeProfileLink(
            labeler ? labeler.creator : {did: label.src, handle: ''},
          )}
          onPress={() => control.close()}>
          {labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src}
        </InlineLink>
      </View>
      <View>
        <Button
          variant="solid"
          color="tertiary"
          size="small"
          label={_(msg`Appeal`)}
          onPress={() => onPressAppeal(label)}>
          <ButtonText>
            <Trans>Appeal</Trans>
          </ButtonText>
        </Button>
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

  const onSubmit = async () => {
    try {
      const $type = !isAccountReport
        ? 'com.atproto.repo.strongRef'
        : 'com.atproto.admin.defs#repoRef'
      await getAgent().createModerationReport({
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
      <Text
        nativeID="dialog-title"
        style={[a.text_2xl, a.font_bold, a.pb_md, a.leading_tight]}>
        <Trans>Appeal "{strings.name}" label</Trans>
      </Text>
      <Text nativeID="dialog-description" style={[a.text_sm, a.leading_snug]}>
        <Trans>
          This appeal will be sent to{' '}
          <InlineLink
            to={makeProfileLink(
              labeler ? labeler.creator : {did: label.src, handle: ''},
            )}
            onPress={() => control.close()}>
            {labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src}
          </InlineLink>
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
          multiline={true}
          textAlignVertical="top"
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
          color="tertiary"
          size="small"
          onPress={onPressBack}
          label={_(msg`Back`)}>
          {_(msg`Back`)}
        </Button>
        <Button
          testID="submitBtn"
          variant="solid"
          color="primary"
          size="small"
          onPress={onSubmit}
          label={_(msg`Submit`)}>
          {_(msg`Submit`)}
        </Button>
      </View>
    </>
  )
}
