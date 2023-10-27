import React from 'react'
import {View, StyleSheet, Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'

export function TagInputEntryButton({
  tags,
  onRequestOpen,
}: {
  tags: string[]
  onRequestOpen: () => void
}) {
  const pal = usePalette('default')
  return (
    <Pressable
      accessibilityRole="button"
      style={state => [
        styles.selectedTags,
        {
          outline: 0,
          opacity: state.pressed || state.focused ? 0.6 : 1,
        },
      ]}
      onPress={onRequestOpen}>
      <View style={[pal.viewLight, styles.button]}>
        {tags.length ? (
          <Text type="md-medium" style={[pal.textLight]}>
            Add +
          </Text>
        ) : (
          <>
            <FontAwesomeIcon
              icon="tags"
              size={12}
              style={pal.textLight as FontAwesomeIconStyle}
            />
            <Text type="md-medium" style={[pal.textLight]}>
              Click to add tags to your post
            </Text>
          </>
        )}
      </View>

      {tags.map(tag => (
        <View key={tag} style={[pal.viewLight, styles.button]}>
          <Text type="md-medium" style={[pal.textLight]}>
            #{tag}
          </Text>
        </View>
      ))}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
})
