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
        pal.viewLight,
        styles.tag,
        {
          opacity: state.pressed || state.focused ? 0.8 : 1,
          outline: 0,
          paddingRight: 6,
        },
      ]}>
      <Text
        type="sm-medium"
        style={[pal.textLight, {lineHeight: 13, paddingBottom: 2}]}>
        #{value}
      </Text>
      <FontAwesomeIcon
        icon="x"
        style={
          {
            opacity: hovered ? 1 : 0.5,
            color: pal.textLight.color,
            marginTop: -1,
          } as FontAwesomeIconStyle
        }
        size={11}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    paddingBottom: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
})
