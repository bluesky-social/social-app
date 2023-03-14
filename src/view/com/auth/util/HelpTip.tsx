import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {InfoCircleIcon} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'

export function HelpTip({text}: {text: string}) {
  const bg = useColorSchemeStyle(
    {backgroundColor: colors.gray1},
    {backgroundColor: colors.gray8},
  )
  const fg = useColorSchemeStyle({color: colors.gray5}, {color: colors.gray4})
  return (
    <View style={[styles.helptip, bg]}>
      <View style={styles.icon}>
        <InfoCircleIcon size={18} style={fg} strokeWidth={1.5} />
      </View>
      <Text type="xs-medium" style={[fg, s.ml5, s.flex1]}>
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    width: 18,
  },
  helptip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
})
