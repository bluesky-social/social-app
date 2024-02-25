import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react-dom'
import {Trans} from '@lingui/macro'

import {useGrapheme} from '../hooks/useGrapheme'

import {Portal} from '#/components/Portal'

import {usePalette} from 'lib/hooks/usePalette'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import {useActorAutocompleteQuery} from 'state/queries/actor-autocomplete'

export interface MatchedSuggestion {
  type: 'mention'
  range: Range | undefined
  index: number
  length: number
  query: string
}

interface AutocompleteProps {
  match: MatchedSuggestion | undefined
  onSelect: (match: MatchedSuggestion, handle: string) => void
}

export interface AutocompleteRef {
  handleKeyDown: (ev: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export const Autocomplete = React.forwardRef<
  AutocompleteRef,
  AutocompleteProps
>(function AutocompleteImpl({match, onSelect}, ref) {
  const pal = usePalette('default')
  const {getGraphemeString} = useGrapheme()

  const {refs, floatingStyles} = useFloating({
    elements: {reference: match?.range},
    placement: 'bottom-start',
    middleware: [
      shift({padding: 12}),
      flip({padding: 12}),
      offset({mainAxis: 4}),
    ],
    whileElementsMounted: autoUpdate,
  })

  const seenMatch = React.useRef<MatchedSuggestion>()
  const {data: items, isFetching} = useActorAutocompleteQuery(
    match ? match.query : '',
  )

  const [hidden, setHidden] = React.useState(false)
  const [cursor, setCursor] = React.useState(0)

  React.useImperativeHandle(
    ref,
    () => ({
      handleKeyDown: ev => {
        if (hidden || !match || !items || items.length < 1) {
          return
        }

        const key = ev.key

        if (key === 'ArrowUp') {
          ev.preventDefault()
          setCursor(cursor <= 0 ? items.length - 1 : cursor - 1)
        } else if (key === 'ArrowDown') {
          ev.preventDefault()
          setCursor((cursor >= items.length - 1 ? -1 : cursor) + 1)
        } else if (key === 'Enter') {
          const item = items[cursor]

          ev.preventDefault()
          onSelect(match, item.handle)
        } else if (key === 'Escape') {
          ev.preventDefault()
          ev.stopPropagation()

          setHidden(true)
        }
      },
    }),
    [hidden, match, items, cursor, setHidden, onSelect],
  )

  if (seenMatch.current !== match) {
    seenMatch.current = match
    setHidden(false)
    setCursor(0)

    return null
  }

  if (hidden || !match) {
    return null
  }

  return (
    <Portal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="rt-autocomplete">
        <View style={[pal.borderDark, pal.view, styles.container]}>
          {items && items.length > 0 ? (
            items.slice(0, 8).map((item, index) => {
              const {name: displayName} = getGraphemeString(
                item.displayName ?? item.handle,
                30, // Heuristic value; can be modified
              )
              const isSelected = cursor === index

              return (
                <Pressable
                  key={item.handle}
                  style={[
                    isSelected ? pal.viewLight : undefined,
                    pal.borderDark,
                    styles.mentionContainer,
                    index === 0
                      ? styles.firstMention
                      : index === items.length - 1
                      ? styles.lastMention
                      : undefined,
                  ]}
                  onPress={() => {
                    onSelect(match!, item.handle)
                  }}
                  accessibilityRole="button">
                  <View style={styles.avatarAndDisplayName}>
                    <UserAvatar avatar={item.avatar ?? null} size={26} />
                    <Text style={pal.text} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </View>
                  <Text type="xs" style={pal.textLight} numberOfLines={1}>
                    @{item.handle}
                  </Text>
                </Pressable>
              )
            })
          ) : (
            <Text type="sm" style={[pal.text, styles.noResult]}>
              {isFetching ? (
                <Trans>Loading...</Trans>
              ) : (
                <Trans>No result</Trans>
              )}
            </Text>
          )}
        </View>
      </div>
    </Portal>
  )
})

const styles = StyleSheet.create({
  container: {
    width: 500,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 4,
  },
  mentionContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  firstMention: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  lastMention: {
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  avatarAndDisplayName: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noResult: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})
