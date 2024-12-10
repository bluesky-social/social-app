import {View} from 'react-native'

import {atoms as a, tokens} from '#/alf'
import {GradientFill} from '#/components/GradientFill'
import {H1} from '#/components/Typography'

export function Gradients() {
  return (
    <View style={[a.gap_md]}>
      <H1>Gradients</H1>

      <View style={[a.gap_md]}>
        {(
          [
            '0deg',
            '45deg',
            '90deg',
            '135deg',
            '180deg',
            '225deg',
            '270deg',
            '315deg',
          ] as const
        ).map(rotate => (
          <View
            key={rotate}
            style={[
              a.relative,
              a.w_full,
              {
                height: 600,
              },
            ]}>
            <GradientFill gradient={tokens.gradients.bonfire} rotate={rotate} />
          </View>
        ))}
      </View>
    </View>
  )
}
