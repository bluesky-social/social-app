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
  if (!modui.alert && !modui.inform && !additionalCauses?.length) {
    return null
  }

  return (
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {modui.alerts.filter(unique).map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {modui.informs.filter(unique).map(cause => (
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
      {post?.labels?.length ? (
        <AdditionalLabels labels={post.labels} size={size} />
      ) : null}
    </Pills.Row>
  )
}

function AdditionalLabels({
  labels,
  size,
}: {
  labels: ComAtprotoLabelDefs.Label[] | undefined
  size?: Pills.CommonProps['size']
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const control = useLabelsOnMeDialogControl()

  if (!labels || !currentAccount) {
    return null
  }
  labels = labels.filter(
    l =>
      !l.val.startsWith('!') &&
      !(l.val === 'bot' && l.src === currentAccount.did),
  )
  if (!labels.length) {
    return null
  }

  return (
    <View style={[a.flex_row]}>
      <LabelsOnMeDialog control={control} labels={labels} type="content" />

      <Pills.LabelBase
        label={l`+${plural(labels.length, {one: '# label', other: '# labels'})}`}
        size={size}
        noBg={size === 'sm'}
        onPress={() => {
          control.open()
        }}
      />
    </View>
  )
}
