import React from 'react'
import {View, Dimensions} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {LABEL_GROUPS, LabelGroupDefinition} from '@atproto/api'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {GlobalDialogProps} from '#/components/dialogs'
import {Button, useButtonContext} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {useLabelGroupStrings} from '#/lib/moderation'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'

export type ReportDialogProps =
  | {
      type: 'post'
      uri: string
      cid: string
    }
  | {
      type: 'user'
      did: string
    }

function LabelGroupButton({labelGroup}: {labelGroup: string}) {
  const t = useTheme()
  const {hovered, focused, pressed} = useButtonContext()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[labelGroup]
  const interacted = hovered || focused || pressed

  const styles = React.useMemo(() => {
    return {
      interacted: {
        backgroundColor: t.palette.contrast_50,
      },
    }
  }, [t])

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.p_md,
        a.rounded_md,
        {paddingRight: 70},
        interacted && styles.interacted,
      ]}>
      <View style={[a.flex_1, a.gap_xs]}>
        <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_700]}>
          {groupInfoStrings.name}
        </Text>
        <Text style={[a.leading_tight, {maxWidth: 400}]}>
          {groupInfoStrings.description}
        </Text>
      </View>

      <View
        style={[
          a.absolute,
          a.inset_0,
          a.justify_center,
          a.pr_md,
          {left: 'auto'},
        ]}>
        <ChevronRight
          size="md"
          fill={
            hovered ? t.palette.primary_500 : t.atoms.text_contrast_400.color
          }
        />
      </View>
    </View>
  )
}

/**
 * TODO copyright link out to DMCA
 * TODO add "other" option
 */
export function ReportDialog({
  params,
  cleanup,
}: GlobalDialogProps<ReportDialogProps>) {
  const t = useTheme()
  const {_} = useLingui()
  const insets = useSafeAreaInsets()
  const control = Dialog.useDialogControl()
  const [_labelGroup, setLabelGroup] = React.useState<string>('')
  const labelGroupStrings = useLabelGroupStrings()

  // REQUIRED CLEANUP
  const onClose = React.useCallback(() => cleanup(), [cleanup])

  const i18n = React.useMemo(() => {
    let title = _(msg`Report this post`)
    let description = _(msg`Why should this post be reviewed?`)

    if (params.type === 'user') {
      title = _(msg`Report this user`)
      description = _(msg`Why should this user be reviewed?`)
    }

    return {
      title,
      description,
    }
  }, [_, params.type])

  const groups = React.useMemo<
    [keyof typeof LABEL_GROUPS, LabelGroupDefinition][]
  >(() => {
    return Object.entries(LABEL_GROUPS).filter(([, def]) => def.configurable)
  }, [])

  return (
    <Dialog.Outer
      defaultOpen
      control={control}
      onClose={onClose}
      nativeOptions={{
        sheet: {
          snapPoints: [Dimensions.get('window').height - insets.top],
        },
      }}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label="Report Dialog">
        <View style={[a.gap_lg]}>
          <View style={[a.justify_center, a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold]}>{i18n.title}</Text>
            <Text style={[a.text_md, t.atoms.text_contrast_700]}>
              {i18n.description}
            </Text>
          </View>

          <Divider />

          <View style={[a.gap_sm, {marginHorizontal: a.p_md.padding * -1}]}>
            {groups.map(([name, def]) => {
              const groupStrings = labelGroupStrings[name]
              return (
                <Button
                  key={def.id}
                  label={_(msg`Create report for ${groupStrings.name}`)}
                  onPress={() => setLabelGroup(name)}>
                  <LabelGroupButton labelGroup={name} />
                </Button>
              )
            })}
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
