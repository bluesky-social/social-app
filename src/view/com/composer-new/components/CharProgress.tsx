import React from 'react'
import {View} from 'react-native'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'
// @ts-ignore no type definition -prf
import ProgressPie from 'react-native-progress/Pie'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export const CharProgress = ({length}: {length: number}) => {
  const t = useTheme()

  const isOver = length > MAX_GRAPHEME_LENGTH

  return (
    <View style={[a.flex_row, a.gap_md, a.align_center, a.px_sm]}>
      <Text style={[isOver && {color: t.palette.negative_500}]}>
        {MAX_GRAPHEME_LENGTH - length}
      </Text>

      <View>
        {isOver ? (
          <ProgressPie
            size={24}
            borderWidth={1}
            borderColor={t.palette.negative_500}
            color={t.palette.negative_500}
            progress={Math.min(
              (length - MAX_GRAPHEME_LENGTH) / MAX_GRAPHEME_LENGTH,
              1,
            )}
          />
        ) : (
          <ProgressCircle
            size={24}
            borderWidth={0}
            color={t.palette.primary_500}
            unfilledColor={t.palette.contrast_200}
            progress={length / MAX_GRAPHEME_LENGTH}
          />
        )}
      </View>
    </View>
  )
}
