import React from 'react'
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native'
import {TextInputFocusEventData} from 'react-native'
import {Pin} from 'pind'

import {isWeb} from '#/platform/detection'
import {useTagAutocomplete} from '#/view/com/composer/text-input/tagsAutocompleteState'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonProps, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

/**
 * Basically `sanitizeHashtag` from `@atproto/api`, but ignores trailing
 * punctuation in case the user intends to use `_` or `-`.
 */
export function sanitizeHashtagOnChange(hashtag: string) {
  return hashtag.replace(/^\d+/g, '').slice(0, 64)
}

function TagButton({
  children,
  onPress,
}: {
  children: string
  onPress: ButtonProps['onPress']
}) {
  return (
    <Button
      label="Remove tag"
      size="tiny"
      variant="solid"
      color="secondary"
      onPress={onPress}>
      <ButtonText style={[a.text_sm]}>#{children}</ButtonText>
      <ButtonIcon icon={X} position="right" />
    </Button>
  )
}

export function OutlineTags({
  max = 8,
  initialTags = [],
  onChangeTags,
}: {
  max?: number
  initialTags?: string[]
  onChangeTags: (tags: string[]) => void
}) {
  const t = useTheme()
  const dropdown = React.useRef<HTMLDivElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const inputWidth = input.current
    ? input.current.getBoundingClientRect().width
    : 200
  const {query, suggestions, setQuery, saveRecentTag} = useTagAutocomplete()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [tags, setTags] = React.useState<string[]>(initialTags)
  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0)

  const dropdownIsActive = Boolean(query.length)

  const closeDropdownAndReset = React.useCallback(() => {
    setQuery('')
    setSelectedItemIndex(0)
  }, [setQuery, setSelectedItemIndex])

  const addTags = React.useCallback(
    (_tags: string[]) => {
      const _t = _tags.slice(0, max)
      setTags(_t)
      onChangeTags(_t)
    },
    [onChangeTags, setTags, max],
  )

  const removeTag = React.useCallback(
    (tag: string) => {
      addTags(tags.filter(t => t !== tag))
    },
    [tags, addTags],
  )

  const addTagAndReset = React.useCallback(
    (value: string) => {
      const tag = sanitizeHashtagOnChange(value).replace(/^#{1}/, '')

      // enforce max hashtag length
      if (tag.length > 0 && tag.length <= 64) {
        addTags(Array.from(new Set([...tags, tag])).slice(0, max))
      }

      saveRecentTag(tag)
      setQuery('')
      input.current?.focus()
      closeDropdownAndReset()
    },
    [max, tags, closeDropdownAndReset, setQuery, addTags, saveRecentTag],
  )

  const onSubmitEditing = React.useCallback(() => {
    const item = suggestions[selectedItemIndex]
    addTagAndReset(item?.value || query)
  }, [query, suggestions, selectedItemIndex, addTagAndReset])

  const onKeyPress = React.useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const {key} = e.nativeEvent

      if (key === 'Backspace' && query === '') {
        addTags(tags.slice(0, -1))
        closeDropdownAndReset()
      } else if (key === ' ') {
        e.preventDefault() // prevents an additional space on web
        addTagAndReset(query)
      }

      if (dropdownIsActive) {
        if (key === 'Escape') {
          closeDropdownAndReset()
        } else if (key === 'ArrowUp') {
          e.preventDefault()
          setSelectedItemIndex(
            (selectedItemIndex + suggestions.length - 1) % suggestions.length,
          )
        } else if (key === 'ArrowDown') {
          e.preventDefault()
          setSelectedItemIndex((selectedItemIndex + 1) % suggestions.length)
        } else if (
          isWeb &&
          key === 'Tab' &&
          // @ts-ignore web only
          !e.nativeEvent.shiftKey
        ) {
          e.preventDefault()
          onSubmitEditing()
        }
      }
    },
    [
      query,
      tags,
      dropdownIsActive,
      selectedItemIndex,
      suggestions.length,
      closeDropdownAndReset,
      setSelectedItemIndex,
      addTags,
      addTagAndReset,
      onSubmitEditing,
    ],
  )

  const onChangeText = React.useCallback(
    async (value: string) => {
      const tag = sanitizeHashtagOnChange(value)

      setQuery(tag)

      if (tag.length) {
        setQuery(tag)
      } else {
        setSelectedItemIndex(0)
      }
    },
    [setSelectedItemIndex, setQuery],
  )

  const onBlur = React.useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      // @ts-ignore
      const target = e.nativeEvent.relatedTarget as HTMLElement | undefined

      if (
        !tags.length &&
        (!target || !target.id.includes('tag_autocomplete_option'))
      ) {
        setQuery('')
      }
    },
    [tags, setQuery],
  )

  React.useEffect(() => {
    // outside click
    function onClick(e: MouseEvent) {
      const drop = dropdown.current
      const control = input.current

      if (
        !drop ||
        !control ||
        e.target === drop ||
        e.target === control ||
        drop.contains(e.target as Node) ||
        control.contains(e.target as Node)
      )
        return

      closeDropdownAndReset()
    }

    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [closeDropdownAndReset])

  return (
    <View ref={containerRef as any} style={[a.w_full]}>
      <View style={[a.flex_row, a.align_start, a.flex_wrap, a.gap_sm]}>
        {tags.map((tag, i) => (
          <TagButton key={tag + i} onPress={() => removeTag(tag)}>
            {tag}
          </TagButton>
        ))}

        {tags.length >= max ? null : (
          <TextInput
            ref={input as any}
            id="tags-autocomplete-input"
            role={'listbox' as any}
            aria-controls="tags-autocomplete-dropdown"
            aria-haspopup="listbox"
            aria-expanded={dropdownIsActive}
            value={query}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
            onSubmitEditing={onSubmitEditing}
            onChangeText={onChangeText}
            blurOnSubmit={false}
            style={[
              a.text_sm,
              a.leading_tight,
              t.atoms.text_contrast_medium,
              {
                paddingVertical: 4,
              },
            ]}
            placeholder="Add tags"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            accessible={true}
            accessibilityLabel="Add tags to your post"
            accessibilityHint={`Type a tag and press enter to add it. You can add up to ${max} tag.`}
          />
        )}
      </View>

      <Pin
        pinned={Boolean(query.length)}
        to={input}
        at="bottomLeft"
        from="topLeft"
        style={{width: inputWidth}}>
        <View
          ref={dropdown as any}
          style={[t.atoms.bg, t.atoms.border_contrast_low, styles.dropdown]}
          role={'listbox' as any}
          id="tags-autocomplete-dropdown">
          {suggestions.map((item, index) => {
            const isFirst = index === 0
            const isLast = index === suggestions.length - 1
            return (
              <Pressable
                id={`tag_autocomplete_option_${item.value}`}
                accessibilityRole="button"
                key={item.value}
                onPress={() => addTagAndReset(item.value)}
                style={state => [
                  t.atoms.border_contrast_low,
                  styles.dropdownItem,
                  {
                    backgroundColor: state.hovered
                      ? t.atoms.bg_contrast_25.backgroundColor
                      : undefined,
                  },
                  selectedItemIndex === index
                    ? t.atoms.bg_contrast_25
                    : undefined,
                  isFirst
                    ? styles.firstResult
                    : isLast
                    ? styles.lastResult
                    : undefined,
                ]}>
                <Text numberOfLines={1}>{item.value}</Text>
              </Pressable>
            )
          })}
        </View>
      </Pin>
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
    fontSize: 15,
    lineHeight: Platform.select({
      web: 20,
      native: 18,
    }),
    paddingTop: 5,
    paddingBottom: 5,
  },
  dropdown: {
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 4,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  firstResult: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  lastResult: {
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
})
