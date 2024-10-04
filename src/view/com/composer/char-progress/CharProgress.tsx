import React from 'react'
import {View} from 'react-native'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'
// @ts-ignore no type definition -prf
import ProgressPie from 'react-native-progress/Pie'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'
import {Text} from '../../util/text/Text'

export function CharProgress({count, max}: {count: number; max?: number}) {
  const maxLength = max || MAX_GRAPHEME_LENGTH
  const pal = usePalette('default')
  const textColor = count > maxLength ? '#e60000' : pal.colors.text
  const circleColor = count > maxLength ? '#e60000' : pal.colors.link
  return (
    <>
      <Text style={[s.mr10, s.tabularNum, {color: textColor}]}>
        {maxLength - count}
      </Text>
      <View>
        {count > maxLength ? (
          <ProgressPie
            size={30}
            borderWidth={4}
            borderColor={circleColor}
            color={circleColor}
            progress={Math.min((count - maxLength) / maxLength, 1)}
          />
        ) : (
          <ProgressCircle
            size={30}
            borderWidth={1}
            borderColor={pal.colors.border}
            color={circleColor}
            progress={count / maxLength}
          />
        )}
      </View>
    </>
  )
}
