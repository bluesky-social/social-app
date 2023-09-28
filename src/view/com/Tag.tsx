import React from 'react'
import {StyleSheet, Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {Text, CustomTextProps} from 'view/com/util/text/Text'
import {Link} from 'view/com/util/Link'

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
    <Link
      asAnchor
      accessible
      anchorNoUnderline
      href={`/search?q=${value}`}
      style={[pal.border, styles.tag]}>
      <Text type={type} style={[pal.textLight]}>
        #{value}
      </Text>
    </Link>
  )
}

export function InlineTag({
  value,
  textSize,
}: {
  value: string
  textSize?: CustomTextProps['type']
}) {
  const pal = usePalette('default')
  const type = textSize || 'xs-medium'

  return (
    <Link
      asAnchor
      accessible
      anchorNoUnderline
      href={`/search?q=${value}`}
      style={[
        pal.border,
        styles.tag,
        {
          paddingTop: 0,
          paddingBottom: 2,
        },
      ]}>
      <Text type={type} style={[pal.textLight]}>
        #{value}
      </Text>
    </Link>
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
    paddingTop: 1,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
})
