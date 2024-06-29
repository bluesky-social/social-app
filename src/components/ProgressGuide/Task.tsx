import React from 'react'
import {View} from 'react-native'
import * as Progress from 'react-native-progress'

import {atoms as a, useTheme} from '#/alf'
import {AnimatedCheck} from '../anim/AnimatedCheck'
import {Text} from '../Typography'

export interface ProgressGuideTaskProps {
  current: number
  total: number
  title: string
  subtitle?: string
}

export function ProgressGuideTask({
  current,
  total,
  title,
  subtitle,
}: ProgressGuideTaskProps) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.gap_sm, !subtitle && a.align_center]}>
      {current === total ? (
        <AnimatedCheck playOnMount fill={t.palette.primary_500} width={16} />
      ) : (
        <Progress.Circle
          progress={current / total}
          color={t.palette.primary_400}
          size={16}
          thickness={2}
          borderWidth={0}
          unfilledColor={t.palette.contrast_50}
        />
      )}
      <View style={[a.flex_col, a.gap_md]}>
        <View style={[a.flex_col, a.gap_xs]}>
          <Text style={[a.text_sm, a.font_semibold]}>{title}</Text>
          {subtitle && (
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
