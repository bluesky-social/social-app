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
import {AppBskyFeedDefs} from '@atproto/api'
import {Pin} from 'pind'

import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonProps} from '#/components/Button'
import {useFeedsAutocomplete} from '#/components/Composer/FeedsSelector/useFeedsAutocomplete'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

/**
 * Basically `sanitizeHashtag` from `@atproto/api`, but ignores trailing
 * punctuation in case the user intends to use `_` or `-`.
 */
export function sanitizeHashtagOnChange(hashtag: string) {
  return hashtag.replace(/^\d+/g, '').slice(0, 64)
}

function FeedCard({
  feed,
  onPress,
}: {
  feed: AppBskyFeedDefs.GeneratorView
  onPress: ButtonProps['onPress']
}) {
  const t = useTheme()
  return (
    <Button
      label="Remove tag"
      size="tiny"
      variant="solid"
      color="secondary"
      onPress={onPress}
      style={[a.py_sm, a.pl_sm, a.pr_md, a.rounded_sm, a.gap_sm]}>
      <UserAvatar avatar="" size={32} type="algo" />
      <View style={[a.flex_1, a.gap_2xs, a.pr_sm]}>
        <Text
          style={[a.text_sm, a.font_bold, a.leading_tight]}
          numberOfLines={1}>
          {feed.displayName}
        </Text>
        <Text
          style={[a.text_xs, a.leading_tight, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          By @{feed.creator.handle}
        </Text>
      </View>
      <ButtonIcon icon={X} position="right" />
    </Button>
  )
}

export function FeedsSelector({
  max = 8,
  initialFeeds = [],
  onChangeFeeds,
}: {
  max?: number
  initialFeeds?: string[]
  onChangeFeeds: (uris: string[]) => void
}) {
  const t = useTheme()
  const dropdown = React.useRef<HTMLDivElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const inputWidth = input.current
    ? input.current.getBoundingClientRect().width
    : 200
  const {query, suggestions, feeds, setQuery} = useFeedsAutocomplete()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [uris, setUris] = React.useState<string[]>(initialFeeds)
  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0)

  const dropdownIsActive = Boolean(query.length)

  const closeDropdownAndReset = React.useCallback(() => {
    setQuery('')
    setSelectedItemIndex(0)
  }, [setQuery, setSelectedItemIndex])

  const addFeeds = React.useCallback(
    (feedUris: string[]) => {
      const uris = feedUris.slice(0, max)
      setUris(uris)
      onChangeFeeds(uris)
    },
    [onChangeFeeds, setUris, max],
  )

  const removeFeed = React.useCallback(
    (uri: string) => {
      addFeeds(uris.filter(t => t !== uri))
    },
    [uris, addFeeds],
  )

  const addFeedAndReset = React.useCallback(
    (uri: string) => {
      addFeeds(Array.from(new Set([...uris, uri])).slice(0, max))
      setQuery('')
      input.current?.focus()
      closeDropdownAndReset()
    },
    [max, uris, closeDropdownAndReset, setQuery, addFeeds],
  )

  const onSubmitEditing = React.useCallback(() => {
    const item = suggestions[selectedItemIndex]
    addFeedAndReset(item?.uri)
  }, [suggestions, selectedItemIndex, addFeedAndReset])

  const onKeyPress = React.useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const {key} = e.nativeEvent

      if (key === 'Backspace' && query === '') {
        addFeeds(uris.slice(0, -1))
        closeDropdownAndReset()
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
        }
      }
    },
    [
      query,
      uris,
      dropdownIsActive,
      selectedItemIndex,
      suggestions.length,
      closeDropdownAndReset,
      setSelectedItemIndex,
      addFeeds,
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
        !uris.length &&
        (!target || !target.id.includes('tag_autocomplete_option'))
      ) {
        setQuery('')
      }
    },
    [uris, setQuery],
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

  const feedViews = uris
    .map(uri => feeds.find(f => f.uri === uri))
    .filter(Boolean) as AppBskyFeedDefs.GeneratorView[]

  return (
    <View ref={containerRef as any} style={[a.w_full]}>
      <View style={[a.flex_row, a.align_start, a.flex_wrap, a.gap_sm]}>
        {feedViews.map(feed => (
          <FeedCard
            key={feed.uri}
            onPress={() => removeFeed(feed.uri)}
            feed={feed}
          />
        ))}

        {uris.length >= max ? null : (
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
            placeholder="Add feeds"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            accessible={true}
            accessibilityLabel="Add feeds to your post"
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
                key={item.uri}
                onPress={() => addFeedAndReset(item.uri)}
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
                <Text numberOfLines={1}>{item.displayName}</Text>
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
