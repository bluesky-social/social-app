import {useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type ModerationCause, type ModerationUI} from '@bsky/sdk/moderation'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {
  filterUserFacingLabels,
  getModerationCauseKey,
  unique,
} from '#/lib/moderation'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {
  LabelsOnMeDialog,
  useLabelsOnMeDialogControl,
} from '#/components/moderation/LabelsOnMeDialog'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {
  PostLabelsDialog,
  usePostLabelsDialogControl,
} from '#/components/moderation/PostLabelsDialog'
import * as Pills from '#/components/Pills'
import {type app, type com} from '#/lexicons'

/**
 * Labels past this many collapse into a chip that opens the full list, so a
 * heavily labeled account cannot push the post off the screen. Hiding a single
 * label is not worth it - the chip is no smaller than the pill it replaces -
 * so the row only collapses once two or more would be hidden.
 */
const MAX_VISIBLE_LABELS = 2

export function PostAlerts({
  post,
  modui,
  view = 'compact',
  style,
  additionalCauses,
}: {
  post?: app.bsky.feed.defs.PostView
  modui: ModerationUI
  /**
   * Expanded views (e.g. the thread anchor post) render larger pills and
   * surface the "+n" additional labels pill. Compact views (feeds, replies)
   * keep the alerts minimal.
   */
  view?: 'expanded' | 'compact'
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
  additionalCauses?: ModerationCause[] | Pills.AppModerationCause[]
}) {
  const {currentAccount} = useSession()
  const size: Pills.CommonProps['size'] = view === 'expanded' ? 'lg' : 'sm'

  const alerts = modui.alerts.filter(unique)
  const informs = modui.informs.filter(unique)
  /*
   * The "+n" pill surfaces labels for the author to review and appeal, so it
   * only applies when the viewer is the author, and only in expanded views.
   * It renders even when no other moderation is visible, since it may be the
   * author's only entry point to appeal labels on their content.
   */
  const isOwnPost = !!post && post.author.did === currentAccount?.did
  const allLabels: com.atproto.label.defs.Label[] =
    isOwnPost && view === 'expanded'
      ? [
          ...(post.labels ?? []),
          /*
           * Account labels appear on Profile. We don't show them here unless the
           * user's mod settings are configured such that the labels land in the
           * modui handling.
           */
          // ...(post.author.labels ?? [])
        ]
      : []
  /*
   * Labels that the moderation system already surfaces in this context -
   * whether as an alert, an inform, or a blur handled by ContentHider - should
   * not be repeated in the "+n" pill.
   */
  const shownCauses = [...alerts, ...informs, ...modui.blurs]
  const additionalLabels = filterUserFacingLabels(
    allLabels,
    currentAccount?.did,
  ).filter(label =>
    shownCauses.every(
      cause =>
        cause.type !== 'label' ||
        cause.label.val !== label.val ||
        cause.label.src !== label.src ||
        cause.label.uri !== label.uri,
    ),
  )

  if (
    !modui.alert &&
    !modui.inform &&
    !additionalCauses?.length &&
    !additionalLabels.length
  ) {
    return null
  }

  const causes: Pills.AppModerationCause[] = [
    ...alerts,
    ...informs,
    ...(additionalCauses ?? []),
  ]
  /*
   * Only labels collapse. The remaining causes (a hidden reply, a mute) are
   * viewer-specific state rather than labels, and there are never enough of
   * them to crowd the post.
   */
  const labelCauses = causes.filter(cause => cause.type === 'label')
  const otherCauses = causes.filter(cause => cause.type !== 'label')
  const hiddenLabelCount = labelCauses.length - MAX_VISIBLE_LABELS
  const collapse = hiddenLabelCount > 1
  const visibleLabels = collapse
    ? labelCauses.slice(0, MAX_VISIBLE_LABELS)
    : labelCauses

  return (
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {visibleLabels.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {collapse ? (
        <CollapsedLabels
          causes={labelCauses}
          hiddenCount={hiddenLabelCount}
          size={size}
        />
      ) : null}
      {otherCauses.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {additionalLabels.length ? (
        <AdditionalLabels
          labels={additionalLabels}
          size={size}
          hasPrecedingPills={causes.length > 0}
        />
      ) : null}
    </Pills.Row>
  )
}

function CollapsedLabels({
  causes,
  hiddenCount,
  size,
}: {
  /** Every label on the post, including the ones still shown as pills. */
  causes: Pills.AppModerationCause[]
  hiddenCount: number
  size?: Pills.CommonProps['size']
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const listControl = usePostLabelsDialogControl()
  const detailsControl = useModerationDetailsDialogControl()
  const [selectedCause, setSelectedCause] = useState<
    Pills.AppModerationCause | undefined
  >(undefined)

  return (
    <View style={[a.flex_row]}>
      <PostLabelsDialog
        control={listControl}
        causes={causes}
        onPressCause={cause => {
          setSelectedCause(cause)
          detailsControl.open()
        }}
      />
      <ModerationDetailsDialog
        control={detailsControl}
        modcause={selectedCause}
      />

      <Pills.LabelBase
        label={l`${plural(causes.length, {
          one: '# label on this post',
          other: '# labels on this post',
        })}`}
        cta={l`${plural(hiddenCount, {
          one: '# more label',
          other: '# more labels',
        })}`}
        size={size}
        noBg={size === 'sm'}
        icon={
          <CircleInfo
            width={size === 'lg' ? 16 : 12}
            fill={t.atoms.text_contrast_medium.color}
          />
        }
        onPress={() => {
          listControl.open()
        }}
      />
    </View>
  )
}

function AdditionalLabels({
  labels,
  size,
  hasPrecedingPills,
}: {
  labels: com.atproto.label.defs.Label[]
  size?: Pills.CommonProps['size']
  /**
   * The compact "+n" syntax only makes sense as a continuation of other
   * pills. When this pill stands alone, spell it out.
   */
  hasPrecedingPills: boolean
}) {
  const {t: l} = useLingui()
  const control = useLabelsOnMeDialogControl()

  return (
    <View style={[a.flex_row]}>
      <LabelsOnMeDialog control={control} labels={labels} type="content" />

      <Pills.LabelBase
        label={l`${plural(labels.length, {
          one: '# label applied to your post',
          other: '# labels applied to your post',
        })}`}
        cta={
          hasPrecedingPills
            ? l`+${labels.length}`
            : l`${plural(labels.length, {
                one: '# label applied',
                other: '# labels applied',
              })}`
        }
        size={size}
        noBg={size === 'sm'}
        onPress={() => {
          control.open()
        }}
      />
    </View>
  )
}
