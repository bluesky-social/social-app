import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  ProgressGuideAction,
  ProgressGuideName,
  useProgressGuide,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {ProgressGuideTask} from './Task'

export function ProgressGuideList({style}: {style: StyleProp<ViewStyle>}) {
  const t = useTheme()
  const {_} = useLingui()
  const guide = useProgressGuide(ProgressGuideName.Like10AndFollow7)
  const {captureAction, endProgressGuide} = useProgressGuideControls()

  React.useEffect(() => {
    const i = setInterval(() => captureAction(ProgressGuideAction.Like), 2e3)
    return () => clearInterval(i)
  }, [captureAction])

  if (guide?.guide === ProgressGuideName.Like10AndFollow7) {
    return (
      <View style={[a.flex_col, a.gap_md, style]}>
        <View style={[a.flex_row, a.align_center]}>
          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.font_semibold,
              a.text_xs,
              {textTransform: 'uppercase'},
            ]}>
            <Trans>Get started</Trans>
          </Text>
          <Button
            variant="ghost"
            size="tiny"
            color="secondary"
            label={_(msg`Dismiss getting started guide`)}
            onPress={endProgressGuide}>
            <ButtonIcon icon={Times} />
          </Button>
        </View>
        <ProgressGuideTask
          current={guide.numLikes}
          total={10}
          title={_(msg`Like 10 posts`)}
          subtitle={_(msg`Teach Discover what you like.`)}
        />
        <ProgressGuideTask
          current={guide.numFollows}
          total={7}
          title={_(msg`Follow 7 accounts`)}
        />
      </View>
    )
  }
  return null
}
