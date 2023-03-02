import React from 'react'
import {View} from 'react-native'
import {Text} from '../../util/text/Text'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'
// @ts-ignore no type definition -prf
import ProgressPie from 'react-native-progress/Pie'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'

const MAX_TEXT_LENGTH = 256
const DANGER_TEXT_LENGTH = MAX_TEXT_LENGTH

export function CharProgress({count}: {count: number}) {
  const pal = usePalette('default')
  const textColor = count > DANGER_TEXT_LENGTH ? '#e60000' : pal.colors.text
  const circleColor = count > DANGER_TEXT_LENGTH ? '#e60000' : pal.colors.link
  return (
    <>
      <Text style={[s.mr10, {color: textColor}]}>
        {MAX_TEXT_LENGTH - count}
      </Text>
      <View>
        {count > DANGER_TEXT_LENGTH ? (
          <ProgressPie
            size={30}
            borderWidth={4}
            borderColor={circleColor}
            color={circleColor}
            progress={Math.min((count - MAX_TEXT_LENGTH) / MAX_TEXT_LENGTH, 1)}
          />
        ) : (
          <ProgressCircle
            size={30}
            borderWidth={1}
            borderColor={pal.colors.border}
            color={circleColor}
            progress={count / MAX_TEXT_LENGTH}
          />
        )}
      </View>
    </>
  )
}
