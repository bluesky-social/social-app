import React from 'react'
import {
  TextInput,
  View,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {isWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {EditableTag} from 'view/com/Tag'

function uniq(tags: string[]) {
  return Array.from(new Set(tags))
}

// function sanitize(tagString: string, { max }: { max: number }) {
//   const sanitized = tagString.replace(/^#/, '')
//     .split(/\s/)
//     .map(t => t.trim())
//     .map(t => t.replace(/^#/, ''))

//   return uniq(sanitized)
//     .slice(0, max)
// }

function sanitize(tagString: string) {
  return tagString.trim().replace(/^#/, '')
}

export function TagInput({
  max = 8,
  onChangeTags,
}: {
  max?: number
  onChangeTags: (tags: string[]) => void
}) {
  const pal = usePalette('default')
  const input = React.useRef<TextInput>(null)
  const [value, setValue] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])

  const handleChangeTags = React.useCallback(
    (_tags: string[]) => {
      setTags(_tags)
      onChangeTags(_tags)
    },
    [onChangeTags, setTags],
  )

  const onSubmitEditing = React.useCallback(() => {
    const tag = sanitize(value)

    if (tag.length > 0) {
      handleChangeTags(uniq([...tags, tag]).slice(0, max))
    }

    if (isWeb) {
      setValue('')
      input.current?.focus()
    } else {
      // This is a hack to get the input to clear on iOS/Android, and only
      // positive values work here
      setTimeout(() => {
        setValue('')
        input.current?.focus()
      }, 1)
    }
  }, [max, value, tags, setValue, handleChangeTags])

  const onKeyPress = React.useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Backspace' && value === '') {
        handleChangeTags(tags.slice(0, -1))
      } else if (e.nativeEvent.key === ' ') {
        e.preventDefault() // prevents an additional space on web
        onSubmitEditing()
      }
    },
    [value, tags, handleChangeTags, onSubmitEditing],
  )

  const onChangeText = React.useCallback((v: string) => {
    setValue(v)
  }, [])

  const removeTag = React.useCallback(
    (tag: string) => {
      handleChangeTags(tags.filter(t => t !== tag))
    },
    [tags, handleChangeTags],
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
        <EditableTag key={tag} value={tag} onRemove={removeTag} />
      ))}
      {tags.length >= max ? null : (
        <TextInput
          ref={input}
          value={value}
          onKeyPress={onKeyPress}
          onSubmitEditing={onSubmitEditing}
          onChangeText={onChangeText}
          blurOnSubmit={false}
          style={[styles.input, pal.textLight]}
          placeholder="Enter a tag and press enter"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          accessible={true}
          accessibilityLabel="Add tags to your post"
          accessibilityHint={`Type a tag and press enter to add it. You can add up to ${max} tag.`}
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
    overflow: 'hidden',
  },
})
