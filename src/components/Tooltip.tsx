import {useState} from 'react'
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'

type TooltipProps = {
  children: React.ReactNode
  tooltipText: string
  tooltipStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const Tooltip = ({
  children,
  tooltipText,
  tooltipStyle = {},
  textStyle = {},
}: TooltipProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button"
        onHoverIn={() => {
          setVisible(prev => !prev)
        }}>
        {children}
      </Pressable>
      {visible && (
        <View style={[styles.tooltip, tooltipStyle]}>
          <Text style={[styles.tooltipText, textStyle]}>{tooltipText}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
})
