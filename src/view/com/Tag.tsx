import React from 'react'
import {StyleSheet, Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'

export function Tag({value}: {value: string}) {
  const pal = usePalette('default')

  return (
    <Text type="xs-medium" style={[styles.tag, pal.viewLight, pal.textLight]}>
      #{value}
    </Text>
  )
}

export function EditableTag({
  value,
  onRemove,
}: {
  value: string
  onRemove: (tag: string) => void
}) {
  const pal = usePalette('default')
  const [hovered, setHovered] = React.useState(false)

  const hoverIn = React.useCallback(() => {
    setHovered(true)
  }, [setHovered])

  const hoverOut = React.useCallback(() => {
    setHovered(false)
  }, [setHovered])

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onRemove(value)}
      onPointerEnter={hoverIn}
      onPointerLeave={hoverOut}
      style={state => [
        pal.border,
        styles.tag,
        {
          opacity: hovered || state.pressed || state.focused ? 0.8 : 1,
          outline: 0,
          paddingRight: 6,
        },
      ]}>
      <Text
        type="xs-medium"
        style={[pal.textLight, {lineHeight: 13, paddingBottom: 2}]}>
        #{value}
      </Text>
      <FontAwesomeIcon
        icon="x"
        style={
          {
            color: hovered ? pal.textLight.color : pal.border.borderColor,
          } as FontAwesomeIconStyle
        }
        size={8}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
})
