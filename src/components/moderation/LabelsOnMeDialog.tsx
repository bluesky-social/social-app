import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useLabelInfo} from '#/lib/moderation/useLabelInfo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {AppealForm} from '#/components/moderation/AppealForm'
import {Text} from '#/components/Typography'
import {Divider} from '../Divider'

export {useDialogControl as useLabelsOnMeDialogControl} from '#/components/Dialog'

export interface LabelsOnMeDialogProps {
  control: Dialog.DialogOuterProps['control']
  labels: ComAtprotoLabelDefs.Label[]
  type: 'account' | 'content'
}

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
  return (
    <Dialog.Outer
      control={props.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <LabelsOnMeDialogInner {...props} />
    </Dialog.Outer>
  )
}

function LabelsOnMeDialogInner(props: LabelsOnMeDialogProps) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [appealingLabel, setAppealingLabel] = useState<
    ComAtprotoLabelDefs.Label | undefined
  >(undefined)
  const {labels} = props
  const isAccount = props.type === 'account'
  const containsSelfLabel = useMemo(
    () => labels.some(l => l.src === currentAccount?.did),
    [currentAccount?.did, labels],
  )

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
            {containsSelfLabel ? (
              <Trans>
                You may appeal non-self labels if you feel they were placed in
                error.
              </Trans>
            ) : (
              <Trans>
                You may appeal these labels if you feel they were placed in
                error.
              </Trans>
            )}
          </Text>

          <View style={[a.py_lg, a.gap_md]}>
            {labels.map(label => (
              <Label
                key={`${label.val}-${label.src}`}
                label={label}
                isSelfLabel={label.src === currentAccount?.did}
                control={props.control}
                onPressAppeal={setAppealingLabel}
              />
            ))}
          </View>
        </>
      )}
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function Label({
  label,
  isSelfLabel,
  control,
  onPressAppeal,
}: {
  label: ComAtprotoLabelDefs.Label
  isSelfLabel: boolean
  control: Dialog.DialogOuterProps['control']
  onPressAppeal: (label: ComAtprotoLabelDefs.Label) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {labeler, strings} = useLabelInfo(label)
  const sourceName = labeler
    ? sanitizeHandle(labeler.creator.handle, '@')
    : label.src
  const timeDiff = useGetTimeAgo({future: true})
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
          <Text emoji style={[a.font_semi_bold, a.text_md]}>
            {strings.name}
          </Text>
          <Text emoji style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            {strings.description}
          </Text>
        </View>
        {!isSelfLabel && (
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
        )}
      </View>

      <Divider />

      <View style={[a.px_md, a.py_sm, t.atoms.bg_contrast_25]}>
        {isSelfLabel ? (
          <Text style={[t.atoms.text_contrast_medium]}>
            <Trans>This label was applied by you.</Trans>
          </Text>
        ) : (
          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.gap_xl,
              {paddingBottom: 1},
            ]}>
            <Text
              style={[a.flex_1, a.leading_snug, t.atoms.text_contrast_medium]}
              numberOfLines={1}>
              <Trans>
                Source:{' '}
                <InlineLinkText
                  label={sourceName}
                  to={makeProfileLink(
                    labeler ? labeler.creator : {did: label.src, handle: ''},
                  )}
                  onPress={() => control.close()}>
                  {sourceName}
                </InlineLinkText>
              </Trans>
            </Text>
            {label.exp && (
              <View>
                <Text
                  style={[
                    a.leading_snug,
                    a.text_sm,
                    a.italic,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Expires in {timeDiff(Date.now(), label.exp)}</Trans>
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
