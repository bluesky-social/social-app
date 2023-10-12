import React from 'react'
import {StyleSheet, Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {Text, CustomTextProps} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'

export function Tag({
  value,
  textSize,
}: {
  value: string
  textSize?: CustomTextProps['type']
}) {
  const pal = usePalette('default')
  const type = textSize || 'xs-medium'

  return (
    <TextLink
      type={type}
      text={`#${value}`}
      accessible
      href={`/search?q=${value}`}
      style={[pal.textLight]}
    />
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
        pal.viewLight,
        styles.editableTag,
        {
          opacity: state.pressed || state.focused ? 0.8 : 1,
          outline: 0,
          paddingRight: 6,
        },
      ]}>
      <Text type="md-medium" style={[pal.textLight]}>
        #{value}
      </Text>
      <FontAwesomeIcon
        icon="x"
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

export function TagButton({
  value,
  icon = 'x',
  onClick,
}: {
  value: string
  icon?: React.ComponentProps<typeof FontAwesomeIcon>['icon']
  onClick?: (tag: string) => void
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
      onPress={() => onClick?.(value)}
      onPointerEnter={hoverIn}
      onPointerLeave={hoverOut}
      style={state => [
        pal.viewLight,
        styles.editableTag,
        {
          opacity: state.pressed || state.focused ? 0.8 : 1,
          outline: 0,
          paddingRight: 6,
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
})
