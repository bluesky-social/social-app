import React from 'react'
import {View, Dimensions, Linking} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyModerationDefs, LabelGroupDefinition} from '@atproto/api'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useTheme, tokens, native} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {GlobalDialogProps} from '#/components/dialogs'
import {
  Button,
  ButtonIcon,
  ButtonText,
  useButtonContext,
} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'
import {
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRight,
  ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft,
} from '#/components/icons/Chevron'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Toggle from '#/components/forms/Toggle'
import {GradientFill} from '#/components/GradientFill'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {Loader} from '#/components/Loader'
import * as Toast from '#/view/com/util/Toast'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useModServicesDetailedInfoQuery} from '#/state/queries/modservice'
import {
  getLabelGroupsFromLabels,
  getModerationServiceTitle,
  useConfigurableLabelGroups,
} from '#/lib/moderation'
import {DMCA_LINK} from '#/components/dialogs/ReportDialog/const'
import {Link} from '#/components/Link'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRight} from '#/components/icons/SquareArrowTopRight'

export type ReportDialogLabelIds = LabelGroupDefinition['id'] | 'other'
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

function LabelGroupButton({
  name,
  description,
}: {
  name: string
  description: string
}) {
  const t = useTheme()
  const {hovered, focused, pressed} = useButtonContext()
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
        <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
          {name}
        </Text>
        <Text style={[a.leading_tight, {maxWidth: 400}]}>{description}</Text>
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
            hovered ? t.palette.primary_500 : t.atoms.text_contrast_low.color
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
              : t.atoms.text_contrast_low.color
          }
        />
      </View>
    </View>
  )
}

function SubmitViewLoader({
  children,
}: {
  children: (props: {
    labelers: AppBskyModerationDefs.ModServiceViewDetailed[]
    labelGroupToModServiceMap: Record<LabelGroupDefinition['id'], string[]>
  }) => React.ReactNode
}) {
  const {
    isLoading: isPreferencesLoading,
    error: preferencesError,
    data: preferences,
  } = usePreferencesQuery()
  const {
    isLoading: isModServicesLoading,
    data: modservices,
    error: modservicesError,
  } = useModServicesDetailedInfoQuery({
    dids: preferences ? preferences.moderationOpts.mods.map(m => m.did) : [],
  })
  const labelGroupToModServiceMap = React.useMemo(() => {
    if (!modservices) return {}

    const groups: Partial<
      Record<
        ReportDialogLabelIds,
        AppBskyModerationDefs.ModServiceViewDetailed[]
      >
    > = {
      // report `other` to all labelers
      other: modservices,
    }

    for (const modservice of modservices) {
      const labelGroups = getLabelGroupsFromLabels(
        modservice.policies.labelValues,
      )
      for (const group of labelGroups) {
        const g = (groups[group.id] = groups[group.id] || [])
        g.push(modservice)
      }
    }

    return groups
  }, [modservices])

  const isLoading = isPreferencesLoading || isModServicesLoading
  const error = preferencesError || modservicesError

  return isLoading ? (
    <View style={[{height: 500}]}>
      <Loader />
    </View>
  ) : error || !(preferences && modservices) ? null : ( // TODO
    children({
      labelers: modservices,
      // TODO mismatched types
      // @ts-ignore
      labelGroupToModServiceMap,
    })
  )
}

function SubmitView({
  selectedLabelGroup,
  goBack,
  onSubmitComplete,
  labelGroupToModServiceMap,
}: {
  selectedLabelGroup: ReportDialogLabelIds
  goBack: () => void
  onSubmitComplete: () => void
  labelers: AppBskyModerationDefs.ModServiceViewDetailed[]
  labelGroupToModServiceMap: Record<
    ReportDialogLabelIds,
    AppBskyModerationDefs.ModServiceViewDetailed[]
  >
}) {
  const t = useTheme()
  const {_} = useLingui()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[selectedLabelGroup]
  const [details, setDetails] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])
  const supportedLabelers = labelGroupToModServiceMap[selectedLabelGroup]

  const submit = React.useCallback(async () => {
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitting(false)

    Toast.show(`Thank you. Your report has been sent.`)

    onSubmitComplete()
  }, [onSubmitComplete])

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
        <Text style={[t.atoms.text_contrast_medium]}>
          Select the moderation service(s) to report to
        </Text>

        {supportedLabelers ? (
          <Toggle.Group
            label="Select mod services"
            values={selectedServices}
            onChange={setSelectedServices}>
            <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
              {supportedLabelers.map(labeler => {
                const title = getModerationServiceTitle({
                  displayName: labeler.creator.displayName,
                  handle: labeler.creator.handle,
                })
                return (
                  <Toggle.Item
                    key={labeler.creator.did}
                    name={labeler.creator.did}
                    label={title}>
                    <ModServiceToggle title={title} />
                  </Toggle.Item>
                )
              })}
            </View>
          </Toggle.Group>
        ) : (
          <View style={[a.p_lg, a.rounded_sm, t.atoms.bg_contrast_25]}>
            <Text style={[a.italic, t.atoms.text_contrast_medium]}>
              None of your subscribed labelers support this content type.
            </Text>
          </View>
        )}
      </View>
      <View style={[a.gap_md]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          Optionally provide additional information below:
        </Text>

        <View style={[a.relative, a.w_full]}>
          <Dialog.Input
            multiline
            value={details}
            onChangeText={setDetails}
            label="Text field"
            style={{paddingRight: 60}}
            numberOfLines={6}
            disabled={!supportedLabelers}
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
          variant="solid"
          color="primary"
          label={_(msg`Submit`)}
          onPress={submit}
          disabled={!supportedLabelers}>
          <ButtonText>Submit</ButtonText>
          {submitting && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}

export function ReportDialog({
  params,
  cleanup,
}: GlobalDialogProps<ReportDialogProps>) {
  // REQUIRED CLEANUP
  const onClose = React.useCallback(() => cleanup(), [cleanup])

  const t = useTheme()
  const {_} = useLingui()
  const insets = useSafeAreaInsets()
  const control = Dialog.useDialogControl()
  const [selectedLabelGroup, setSelectedLabelGroup] = React.useState<
    ReportDialogLabelIds | undefined
  >()
  const labelGroupStrings = useLabelGroupStrings()
  const groups = useConfigurableLabelGroups()

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

  const next = React.useCallback(
    (group: ReportDialogLabelIds | 'copyright') => {
      if (group === 'copyright') {
        Linking.openURL(DMCA_LINK)
      } else {
        setSelectedLabelGroup(group)
      }
    },
    [setSelectedLabelGroup],
  )

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
          <SubmitViewLoader>
            {props => (
              // TODO same types mismatch
              // @ts-ignore
              <SubmitView
                {...props}
                selectedLabelGroup={selectedLabelGroup}
                goBack={() => setSelectedLabelGroup(undefined)}
                onSubmitComplete={control.close}
              />
            )}
          </SubmitViewLoader>
        ) : (
          <View style={[a.gap_lg]}>
            <View style={[a.justify_center, a.gap_sm]}>
              <Text style={[a.text_2xl, a.font_bold]}>{i18n.title}</Text>
              <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                {i18n.description}
              </Text>
            </View>

            <Divider />

            <View style={[a.gap_sm, {marginHorizontal: a.p_md.padding * -1}]}>
              {groups.map(def => {
                const strings = labelGroupStrings[def.id]
                return (
                  <Button
                    key={def.id}
                    label={_(msg`Create report for ${strings.name}`)}
                    onPress={() => next(def.id)}>
                    <LabelGroupButton
                      name={strings.name}
                      description={strings.description}
                    />
                  </Button>
                )
              })}

              <Button
                label={_(msg`Create report for other reasons`)}
                onPress={() => next('other')}>
                <LabelGroupButton
                  name="Other"
                  description="An issue not covered by another option"
                />
              </Button>

              <View style={[a.pt_md, a.px_md]}>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.gap_md,
                    a.p_md,
                    a.pl_lg,
                    a.rounded_md,
                    t.atoms.bg_contrast_900,
                  ]}>
                  <Text style={[t.atoms.text_inverted, a.italic]}>
                    Need to report a copyright violation?
                  </Text>
                  <Link
                    to={DMCA_LINK}
                    label={_(
                      msg`View details for reporting a copyright violation`,
                    )}
                    size="small"
                    variant="solid"
                    color="secondary">
                    <ButtonText>View details</ButtonText>
                    <ButtonIcon position="right" icon={SquareArrowTopRight} />
                  </Link>
                </View>
              </View>
            </View>
          </View>
        )}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
