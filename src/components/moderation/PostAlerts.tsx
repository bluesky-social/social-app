import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  type AppBskyFeedDefs,
  type ComAtprotoLabelDefs,
  type ModerationCause,
  type ModerationUI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {getModerationCauseKey, unique} from '#/lib/moderation'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {
  LabelsOnMeDialog,
  useLabelsOnMeDialogControl,
} from '#/components/moderation/LabelsOnMeDialog'
import * as Pills from '#/components/Pills'

export function PostAlerts({
  post,
  modui,
  size = 'sm',
  style,
  additionalCauses,
}: {
  post?: AppBskyFeedDefs.PostView
  modui: ModerationUI
  size?: Pills.CommonProps['size']
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
  additionalCauses?: ModerationCause[] | Pills.AppModerationCause[]
}) {
  const {currentAccount} = useSession()

  const alerts = modui.alerts.filter(unique)
  const informs = modui.informs.filter(unique)
  /*
   * The "+n" pill surfaces labels for the author to review and appeal, so it
   * only applies when the viewer is the author. It renders even when no other
   * moderation is visible, since it may be the author's only entry point to
   * appeal labels on their content.
   */
  const isOwnPost = !!post && post.author.did === currentAccount?.did
  const allLabels: ComAtprotoLabelDefs.Label[] = isOwnPost
    ? [...(post.labels ?? []), ...(post.author.labels ?? [])]
    : []
  /*
   * Labels that the moderation system already surfaces in this context -
   * whether as an alert, an inform, or a blur handled by ContentHider - should
   * not be repeated in the "+n" pill. System labels and the author's own
   * "bot" self-label are excluded the same way LabelsOnMe excludes them.
   */
  const shownCauses = [...alerts, ...informs, ...modui.blurs]
  const additionalLabels = allLabels.filter(
    label =>
      !label.val.startsWith('!') &&
      !(label.val === 'bot' && label.src === currentAccount?.did) &&
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

  return (
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {alerts.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {informs.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {additionalCauses?.map(cause => (
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
          hasPrecedingPills={
            alerts.length > 0 ||
            informs.length > 0 ||
            (additionalCauses?.length ?? 0) > 0
          }
        />
      ) : null}
    </Pills.Row>
  )
}

function AdditionalLabels({
  labels,
  size,
  hasPrecedingPills,
}: {
  labels: ComAtprotoLabelDefs.Label[]
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
        label={
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
