import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '../Button'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '../icons/Times'
import {Text} from '../Typography'
import {ProgressGuideTask} from './Task'

export function ProgressGuideList() {
  const t = useTheme()
  const {_} = useLingui()

  const [numLikes, setNumLikes] = React.useState<number>(0)
  const [numFollows, setNumFollows] = React.useState<number>(0)

  // DEBUG
  React.useEffect(() => {
    const i = setInterval(() => {
      setNumLikes(v => (v >= 10 ? 0 : v + 1))
      setNumFollows(v => (v >= 7 ? 0 : v + 1))
    }, 1000)
    return () => {
      clearInterval(i)
    }
  }, [setNumLikes])

  return (
    <View style={[a.flex_col, a.gap_md]}>
      <View style={[a.flex_row, a.align_center]}>
        <Text
          style={[t.atoms.text_contrast_medium, a.font_semibold, a.text_xs]}>
          <Trans>GET STARTED</Trans>
        </Text>
        <Button
          variant="ghost"
          size="tiny"
          color="secondary"
          label={_(msg`Dismiss get started`)}>
          <ButtonIcon icon={Times} />
        </Button>
      </View>
      <ProgressGuideTask
        current={numLikes}
        total={10}
        title={_(msg`Like 10 posts`)}
        subtitle={_(msg`Teach Discover what you like.`)}
      />
      <ProgressGuideTask
        current={numFollows}
        total={7}
        title={_(msg`Follow 7 people`)}
      />
    </View>
  )
}
