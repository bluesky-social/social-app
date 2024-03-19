import React from 'react'
import {StyleSheet, View} from 'react-native'

import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {Text} from '#/components/Typography'
import {atoms as a, useTheme} from '#/alf'
import {colors} from '#/lib/styles'

export function FormError({error}: {error?: string}) {
  const t = useTheme()

  if (!error) return null

  return (
    <View style={styles.error}>
      <Warning fill={t.palette.white} size="sm" />
      <View style={(a.flex_1, a.ml_sm)}>
        <Text style={[{color: t.palette.white}, a.font_bold]}>{error}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    backgroundColor: colors.red4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
})
