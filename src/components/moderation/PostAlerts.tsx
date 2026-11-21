import {useLayoutEffect, useRef, useState} from 'react'
import {
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import {type ModerationCause, type ModerationUI} from '@bsky/sdk/moderation'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {
  filterUserFacingLabels,
  getModerationCauseKey,
  unique,
} from '#/lib/moderation'
import {useSession} from '#/state/session'
import {atoms as a, useAlf, useTheme} from '#/alf'
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
  const {t: l, i18n} = useLingui()
  const {fontScale, width: windowWidth} = useWindowDimensions()
  const alf = useAlf()
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

  /*
   * The row keeps only the label pills that fit on its first line, with the
   * rest collapsed behind a "+n more" chip. Pill widths vary too much across
   * labels, locales and font scales for a count cap to bound the row's
   * height, so the fit is measured: the row commits uncollapsed with a hidden
   * copy of the chip, a layout effect reads the laid-out widths, and the
   * collapsed row replaces it before the frame is painted. A single label
   * never collapses - the chip would take about as much space as the pill it
   * hides - so measurement is skipped below two labels.
   */
  const isCollapsible = labelCauses.length >= 2
  /*
   * The window width stands in for the row's width: a resize or rotation
   * changes the key, which throws away the measurement and re-measures.
   */
  const measureKey = [
    size,
    i18n.locale,
    fontScale,
    alf.fonts.scale,
    windowWidth,
    ...labelCauses.map(getModerationCauseKey),
  ].join('|')
  const [measured, setMeasured] = useState<{
    key: string
    visibleCount: number
  } | null>(null)
  const rowRef = useRef<View>(null)
  const chipRef = useRef<View>(null)
  const pillRefs = useRef<Array<View | null>>([])
  const isMeasuring = isCollapsible && measured?.key !== measureKey

  useLayoutEffect(() => {
    if (!isMeasuring) return
    const row = measureNode(rowRef.current)
    const chip = measureNode(chipRef.current)
    const pills = labelCauses.map((_, i) => measureNode(pillRefs.current[i]))
    if (!row || !chip || pills.some(rect => rect === null)) {
      return
    }
    const rects = pills as MeasuredRect[]
    const gap = Pills.ROW_GAP[size]
    let visibleCount: number
    const firstTop = rects[0].top
    if (rects.every(rect => Math.abs(rect.top - firstTop) < 1)) {
      visibleCount = labelCauses.length
    } else {
      let used = chip.width
      let count = 0
      for (const rect of rects) {
        if (used + gap + rect.width > row.width + 0.5) break
        used += gap + rect.width
        count++
      }
      visibleCount = count
    }
    setMeasured({key: measureKey, visibleCount})
  }, [isMeasuring, measureKey, labelCauses, size])

  if (
    !modui.alert &&
    !modui.inform &&
    !additionalCauses?.length &&
    !additionalLabels.length
  ) {
    return null
  }

  const visibleLabels =
    !isMeasuring && measured?.key === measureKey
      ? labelCauses.slice(0, measured.visibleCount)
      : labelCauses
  const hiddenCount = labelCauses.length - visibleLabels.length

  return (
    <Pills.Row
      ref={rowRef}
      size={size}
      style={[size === 'sm' && {marginLeft: -3}, style]}>
      {visibleLabels.map((cause, i) => (
        <View
          key={getModerationCauseKey(cause)}
          ref={el => {
            pillRefs.current[i] = el
          }}
          style={[a.flex_row]}>
          <Pills.Label
            cause={cause}
            size={size}
            noBg={size === 'sm'}
            disableDetailsDialog={isMeasuring}
          />
        </View>
      ))}
      {isMeasuring ? (
        /*
         * Hidden copy of the chip, rendered at its widest possible text so the
         * measured fit holds for whatever count the real chip ends up showing.
         */
        <View
          ref={chipRef}
          style={[a.absolute, {opacity: 0}]}
          pointerEvents="none"
          accessible={false}>
          <CollapsedLabelsChip
            label={l`${plural(labelCauses.length, {
              one: '# more label',
              other: '# more labels',
            })}`}
            size={size}
            disabled
            onPress={() => {}}
          />
        </View>
      ) : hiddenCount > 0 ? (
        <CollapsedLabels
          causes={labelCauses}
          hiddenCount={hiddenCount}
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

      <CollapsedLabelsChip
        label={l`${plural(causes.length, {
          one: '# label on this post',
          other: '# labels on this post',
        })}`}
        cta={
          hiddenCount === causes.length
            ? l`${plural(hiddenCount, {
                one: '# label',
                other: '# labels',
              })}`
            : l`${plural(hiddenCount, {
                one: '# more label',
                other: '# more labels',
              })}`
        }
        size={size}
        onPress={() => {
          listControl.open()
        }}
      />
    </View>
  )
}

function CollapsedLabelsChip({
  label,
  cta,
  size,
  disabled,
  onPress,
}: {
  label: string
  cta?: string
  size?: Pills.CommonProps['size']
  disabled?: boolean
  onPress: () => void
}) {
  const t = useTheme()

  return (
    <Pills.LabelBase
      label={label}
      cta={cta}
      size={size}
      noBg={size === 'sm'}
      disabled={disabled}
      icon={
        <CircleInfo
          width={size === 'lg' ? 16 : 12}
          fill={t.atoms.text_contrast_medium.color}
        />
      }
      onPress={onPress}
    />
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

type MeasuredRect = {top: number; width: number}

/**
 * Synchronous layout read. `getBoundingClientRect` is available on web
 * elements and, on native, on Fabric host components via React Native's DOM
 * node APIs. Returns null when the node is unmounted or the API is missing,
 * in which case the row simply stays uncollapsed.
 */
function measureNode(node: View | null): MeasuredRect | null {
  const el = node as null | {getBoundingClientRect?: () => MeasuredRect}
  if (!el?.getBoundingClientRect) return null
  const rect = el.getBoundingClientRect()
  return {top: rect.top, width: rect.width}
}
