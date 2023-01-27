import React from 'react'
import {View} from 'react-native'
import {Text} from '../util/text/Text'
import {s} from '../../lib/styles'

const MAX_TEXT_LENGTH = 256
const DANGER_TEXT_LENGTH = MAX_TEXT_LENGTH

export function CharProgress({count}: {count: number}) {
  const progressColor = count > DANGER_TEXT_LENGTH ? '#e60000' : undefined
  return (
    <>
      <Text style={[s.mr10, {color: progressColor}]}>
        {MAX_TEXT_LENGTH - count}
      </Text>
      <View>
        {
          null /* TODO count > DANGER_TEXT_LENGTH ? (
          <ProgressPie
            size={30}
            borderWidth={4}
            borderColor={progressColor}
            color={progressColor}
            progress={Math.min((count - MAX_TEXT_LENGTH) / MAX_TEXT_LENGTH, 1)}
          />
        ) : (
          <ProgressCircle
            size={30}
            borderWidth={1}
            borderColor={colors.gray2}
            color={progressColor}
            progress={count / MAX_TEXT_LENGTH}
          />
        )*/
        }
      </View>
    </>
  )
}
