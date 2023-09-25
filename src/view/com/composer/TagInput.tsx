import React from 'react'
import {
  TextInput,
  View,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Pressable,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'

function Tag({
  tag,
  removeTag,
}: {
  tag: string
  removeTag: (tag: string) => void
}) {
  const pal = usePalette('default')
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => removeTag(tag)}
      style={state => ({
        opacity: state.hovered || state.pressed || state.focused ? 0.8 : 1,
        outline: 0,
      })}>
      <Text type="xs-medium" style={[styles.tag, pal.viewLight, pal.textLight]}>
        #{tag}
      </Text>
    </Pressable>
  )
}

export function TagInput({max}: {max: number}) {
  const pal = usePalette('default')
  const input = React.useRef<TextInput>(null)
  const [value, setValue] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])

  const onKeyPress = React.useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Enter') {
        const _tags = value.trim().split(' ').filter(Boolean)

        if (_tags.length > 0) {
          setTags(Array.from(new Set([...tags, ..._tags])).slice(0, max))
          setValue('')
        }

        setTimeout(() => {
          input.current?.focus()
        }, 100)
      } else if (e.nativeEvent.key === 'Backspace' && value === '') {
        setTags(tags.slice(0, -1))
      }
    },
    [max, value, tags, setValue, setTags],
  )

  const onChangeText = React.useCallback((value: string) => {
    const sanitized = value.replace(/^#/, '')
    setValue(sanitized)
  }, [])

  const removeTag = React.useCallback(
    (tag: string) => {
      setTags(tags.filter(t => t !== tag))
    },
    [tags, setTags],
  )

  return (
    <View style={styles.outer}>
      {!tags.length && (
        <FontAwesomeIcon
          icon="tags"
          size={14}
          style={pal.textLight as FontAwesomeIconStyle}
        />
      )}
      {tags.map(tag => (
        <Tag key={tag} tag={tag} removeTag={removeTag} />
      ))}
      {tags.length >= max ? null : (
        <TextInput
          ref={input}
          value={value}
          onKeyPress={onKeyPress}
          onChangeText={onChangeText}
          style={[styles.input, pal.textLight]}
          placeholder="Add tags..."
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          accessible={true}
          accessibilityLabel="Add tags to your post"
          accessibilityHint={`You may add up to 8 tags to your post, including those used inline.`}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flexGrow: 1,
    minWidth: 100,
    fontSize: 13,
    paddingVertical: 4,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
})
