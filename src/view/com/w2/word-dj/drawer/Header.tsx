import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import {alphaBg, s} from 'lib/styles'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'

interface Props {
  title: string
  onBack?: () => void
  onClose?: () => void
}

export const Header = ({title, onBack, onClose}: Props) => {
  const pal = usePalette('default')

  return (
    <View style={[s.flexRow, s.alignCenter]}>
      {onBack ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="back"
          accessibilityHint=""
          style={[styles.button, alphaBg(pal.viewInverted, 0.2)]}
          onPress={onBack}>
          <FontAwesomeIcon
            icon="angle-left"
            style={pal.textInverted as FontAwesomeIconStyle}
            size={24}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.button} />
      )}
      <View style={[s.flex1, s.alignCenter]}>
        <Text type="lg-bold" style={[pal.text]}>
          {title}
        </Text>
      </View>
      {onClose ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="close"
          accessibilityHint=""
          style={[styles.button, alphaBg(pal.viewInverted, 0.2)]}
          onPress={onClose}>
          <FontAwesomeIcon
            icon="xmark"
            style={pal.textInverted as FontAwesomeIconStyle}
            size={24}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.button} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
