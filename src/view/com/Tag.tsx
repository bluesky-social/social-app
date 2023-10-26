import React from 'react'
import {StyleSheet, Pressable, StyleProp, TextStyle} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {isWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {Text, CustomTextProps} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'

export function Tag({
  value,
  textSize,
  smallSigil,
  style,
}: {
  value: string
  textSize?: CustomTextProps['type']
  smallSigil?: boolean
  style?: StyleProp<TextStyle>
}) {
  const theme = useTheme()
  const type = textSize || 'xs-medium'
  const typeFontSize = theme.typography[type].fontSize || 16
  const hashtagFontSize = typeFontSize * (smallSigil ? 0.8 : 1)

  return (
    <TextLink
      type={type}
      text={`#${value}`}
      accessible
      href={`/search?q=${value}`}
      style={style}>
      <Text
        style={[
          style,
          {
            fontSize: hashtagFontSize,
            fontWeight: '500',
          },
        ]}>
        #
      </Text>
      {value}
    </TextLink>
  )
}

export function TagButton({
  value,
  icon = 'x',
  onClick,
  removeTag,
}: {
  value: string
  icon?: React.ComponentProps<typeof FontAwesomeIcon>['icon']
  onClick?: (tag: string) => void
  removeTag?: (tag: string) => void
}) {
  const pal = usePalette('default')
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)

  const hoverIn = React.useCallback(() => {
    setHovered(true)
  }, [setHovered])

  const hoverOut = React.useCallback(() => {
    setHovered(false)
  }, [setHovered])

  React.useEffect(() => {
    if (!isWeb) return

    function listener(e: KeyboardEvent) {
      if (e.key === 'Backspace') {
        if (focused) {
          removeTag?.(value)
        }
      }
    }

    document.addEventListener('keydown', listener)

    return () => {
      document.removeEventListener('keydown', listener)
    }
  }, [value, focused, removeTag])

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onClick?.(value)}
      onPointerEnter={hoverIn}
      onPointerLeave={hoverOut}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={state => [
        pal.viewLight,
        styles.tagButton,
        {
          outline: 0,
          opacity: state.pressed || state.focused ? 0.6 : 1,
          paddingRight: 10,
        },
      ]}>
      <Text type="md-medium" style={[pal.textLight]}>
        #{value}
      </Text>
      <FontAwesomeIcon
        icon={icon}
        style={
          {
            opacity: hovered ? 1 : 0.5,
            color: pal.textLight.color,
            marginTop: 1,
          } as FontAwesomeIconStyle
        }
        size={10}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  editableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    paddingVertical: 6,
    paddingTop: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
})
