import React from 'react'
import {View} from 'react-native'
import {LabelPreference} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import Animated, {Easing, Layout, FadeIn} from 'react-native-reanimated'

import {
  CONFIGURABLE_LABEL_GROUPS,
  ConfigurableLabelGroup,
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function ModerationOption({
  labelGroup,
  isMounted,
}: {
  labelGroup: ConfigurableLabelGroup
  isMounted: React.MutableRefObject<boolean>
}) {
  const {_} = useLingui()
  const t = useTheme()
  const groupInfo = CONFIGURABLE_LABEL_GROUPS[labelGroup]
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const visibility =
    variables?.visibility ?? preferences?.contentLabels?.[labelGroup]

  const onChange = React.useCallback(
    (vis: string[]) => {
      mutate({labelGroup, visibility: vis[0] as LabelPreference})
    },
    [mutate, labelGroup],
  )

  const labels = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    show: _(msg`Show`),
  }

  return (
    <Animated.View
      style={[
        a.flex_row,
        a.justify_between,
        a.gap_sm,
        a.py_xs,
        a.px_xs,
        a.align_center,
      ]}
      layout={Layout.easing(Easing.ease).duration(200)}
      entering={isMounted.current ? FadeIn : undefined}>
      <View style={[a.gap_xs, {width: '50%'}]}>
        <Text style={[a.font_bold]}>{groupInfo.title}</Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {groupInfo.subtitle}
        </Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        <ToggleButton.Group
          label={_(
            msg`Configure content filtering setting for category: ${groupInfo.title.toLowerCase()}`,
          )}
          values={[visibility ?? 'hide']}
          onChange={onChange}>
          <ToggleButton.Button name="hide" label={labels.hide}>
            {labels.hide}
          </ToggleButton.Button>
          <ToggleButton.Button name="warn" label={labels.warn}>
            {labels.warn}
          </ToggleButton.Button>
          <ToggleButton.Button name="ignore" label={labels.show}>
            {labels.show}
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>
    </Animated.View>
  )
}
