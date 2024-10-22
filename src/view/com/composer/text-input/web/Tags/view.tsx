import React, {forwardRef, useImperativeHandle, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {ReactRenderer} from '@tiptap/react'
import {
  SuggestionKeyDownProps,
  SuggestionOptions,
  SuggestionProps,
} from '@tiptap/suggestion'
import tippy, {Instance as TippyInstance} from 'tippy.js'

import {usePalette} from '#/lib/hooks/usePalette'
import {useTagAutocomplete} from '#/view/com/composer/text-input/tagsAutocompleteState'
import {Text} from '#/view/com/util/text/Text'
import {parsePunctuationFromTag} from './utils'

type AutocompleteRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export function createTagsAutocomplete(): Omit<SuggestionOptions, 'editor'> {
  return {
    render() {
      let component: ReactRenderer<AutocompleteRef> | undefined
      let popup: TippyInstance[] | undefined

      return {
        onStart: props => {
          component = new ReactRenderer(Autocomplete, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) return

          // @ts-ignore getReferenceClientRect doesnt like that clientRect can return null -prf
          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props) {
          component?.updateProps(props)

          if (!props.clientRect) return

          popup?.[0]?.setProps({
            // @ts-ignore getReferenceClientRect doesnt like that clientRect can return null -prf
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide()

            return true
          }

          return component?.ref?.onKeyDown(props) || false
        },
        onExit() {
          popup?.[0]?.destroy()
          component?.destroy()
        },
      }
    },
  }
}

const Autocomplete = forwardRef<AutocompleteRef, SuggestionProps>(
  function AutocompleteImpl(props, ref) {
    const {command, query} = props
    const {suggestions, setQuery, saveRecentTag} = useTagAutocomplete()
    const pal = usePalette('default')
    const [selectedIndex, setSelectedIndex] = useState(0)

    React.useEffect(() => {
      setQuery(query)
    }, [query, setQuery])

    const commit = React.useCallback(
      (query: string) => {
        const {tag, punctuation} = parsePunctuationFromTag(query)
        /*
         * This values here are passed directly to the `command` method
         * configured in the `Tags` plugin.
         *
         * The type error is ignored because we parse the tag and punctuation
         * separately above. We could do this in `command` definition, but we
         * only want to `commitRecentTag` with the sanitized tag.
         */
        command({tag, punctuation})
        saveRecentTag(tag)
      },
      [command, saveRecentTag],
    )

    const selectItem = React.useCallback(
      (index: number) => {
        const item = suggestions[index]
        if (item) commit(item.value)
      },
      [suggestions, commit],
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({event}) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(
            (selectedIndex + suggestions.length - 1) % suggestions.length,
          )
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % suggestions.length)
          return true
        }

        if (event.key === 'Enter') {
          if (!suggestions.length) {
            // no suggestions, use whatever the user typed
            commit(props.query)
          } else {
            selectItem(selectedIndex)
          }
          return true
        }

        if (event.key === ' ') {
          commit(props.query)
          return true
        }

        return false
      },
    }))

    // hide entirely if no suggestions
    if (!suggestions.length) return null

    return (
      <div className="items">
        <View style={[pal.borderDark, pal.view, styles.container]}>
          {suggestions.map(({value}, index) => {
            const {tag} = parsePunctuationFromTag(value)
            const isSelected = selectedIndex === index
            const isFirst = index === 0
            const isLast = index === suggestions.length - 1

            return (
              <Pressable
                key={tag}
                style={state => [
                  styles.resultContainer,
                  {
                    backgroundColor: state.hovered
                      ? pal.viewLight.backgroundColor
                      : undefined,
                  },
                  isSelected ? pal.viewLight : undefined,
                  isFirst
                    ? styles.firstResult
                    : isLast
                    ? styles.lastResult
                    : undefined,
                ]}
                onPress={() => selectItem(index)}
                accessibilityRole="button">
                <Text type="md" style={pal.textLight} numberOfLines={1}>
                  #{tag}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </div>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    width: 500,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 4,
  },
  resultContainer: {
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
