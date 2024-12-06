import {StyleProp, View, ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  useProgressGuide,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {ProgressGuideTask} from './Task'

export function ProgressGuideList({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  const {_} = useLingui()
  const guide = useProgressGuide('like-10-and-follow-7')
  const {endProgressGuide} = useProgressGuideControls()

  if (guide) {
    return (
      <View style={[a.flex_col, a.gap_md, style]}>
        <View style={[a.flex_row, a.align_center, a.justify_between]}>
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.font_bold,
              a.text_sm,
              {textTransform: 'uppercase'},
            ]}>
            <Trans>Getting started</Trans>
          </Text>
          <Button
            variant="ghost"
            size="tiny"
            color="secondary"
            shape="round"
            label={_(msg`Dismiss getting started guide`)}
            onPress={endProgressGuide}>
            <ButtonIcon icon={Times} size="sm" />
          </Button>
        </View>
        <ProgressGuideTask
          current={guide.numLikes + 1}
          total={10 + 1}
          title={_(msg`Like 10 posts`)}
          subtitle={_(msg`Teach our algorithm what you like`)}
        />
        <ProgressGuideTask
          current={guide.numFollows + 1}
          total={7 + 1}
          title={_(msg`Follow 7 accounts`)}
          subtitle={_(msg`Bluesky is better with friends!`)}
        />
      </View>
    )
  }
  return null
}
