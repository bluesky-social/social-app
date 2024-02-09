import React from 'react'
import {View, Dimensions} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {LABEL_GROUPS, LabelGroupDefinition} from '@atproto/api'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme, tokens, native} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {GlobalDialogProps} from '#/components/dialogs'
import {Button, ButtonIcon, useButtonContext} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {useLabelGroupStrings} from '#/lib/moderation'
import {
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRight,
  ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft,
} from '#/components/icons/Chevron'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Toggle from '#/components/forms/Toggle'
import {GradientFill} from '#/components/GradientFill'
import * as TextField from '#/components/forms/TextField'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'

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

function ModServiceToggle({title}: {title: string}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()

  return (
    <View
      style={[
        a.py_md,
        a.px_xl,
        a.rounded_full,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
      ]}>
      {ctx.selected && <GradientFill gradient={tokens.gradients.midnight} />}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.z_10,
        ]}>
        <Text
          style={[
            native({marginTop: 2}),
            {
              color:
                t.name === 'light' && ctx.selected
                  ? t.palette.white
                  : t.atoms.text.color,
            },
          ]}>
          {title}
        </Text>
        <Plus
          size="sm"
          fill={
            ctx.selected
              ? t.palette.primary_200
              : t.atoms.text_contrast_400.color
          }
        />
      </View>
    </View>
  )
}

function SubmitView({
  selectedLabelGroup,
  goBack,
}: {
  selectedLabelGroup: string
  goBack: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[selectedLabelGroup]
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])
  const [details, setDetails] = React.useState<string>('')

  return (
    <View style={[a.gap_2xl]}>
      <Button
        size="small"
        variant="solid"
        color="secondary"
        shape="round"
        label={_(msg`Go back to previous step`)}
        onPress={goBack}>
        <ButtonIcon icon={ChevronLeft} />
      </Button>

      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.p_md,
          a.rounded_md,
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.text_md, a.font_bold]}>{groupInfoStrings.name}</Text>
          <Text style={[a.leading_tight, {maxWidth: 400}]}>
            {groupInfoStrings.description}
          </Text>
        </View>

        <Check size="md" style={[a.pr_sm]} />
      </View>

      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_700]}>
          Select the moderation service(s) to report to
        </Text>

        <Toggle.Group
          label="Select mod services"
          values={selectedServices}
          onChange={setSelectedServices}>
          <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
            <Toggle.Item name="bluesky" label="Bluesky">
              <ModServiceToggle title="Bluesky" />
            </Toggle.Item>
            <Toggle.Item name="contraption" label="The Contraption">
              <ModServiceToggle title="The Contraption" />
            </Toggle.Item>
            <Toggle.Item name="safety" label="Safety Corp">
              <ModServiceToggle title="Safety Corp" />
            </Toggle.Item>
          </View>
        </Toggle.Group>
      </View>
      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_700]}>
          Optionally provide additional information below:
        </Text>

        <View style={[a.relative, a.w_full]}>
          <TextField.Input
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

      <View style={[a.align_end]}>
        <Button
          size="large"
          variant="gradient"
          color="gradient_midnight"
          label={_(msg`Submit`)}>
          Submit
        </Button>
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
  const [selectedLabelGroup, setSelectedLabelGroup] =
    React.useState<string>('nudity')
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
        {selectedLabelGroup ? (
          <SubmitView
            selectedLabelGroup={selectedLabelGroup}
            goBack={() => setSelectedLabelGroup('')}
          />
        ) : (
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
                    onPress={() => setSelectedLabelGroup(name)}>
                    <LabelGroupButton labelGroup={name} />
                  </Button>
                )
              })}
            </View>
          </View>
        )}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
