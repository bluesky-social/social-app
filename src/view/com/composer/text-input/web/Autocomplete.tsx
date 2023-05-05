import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import {StyleSheet, View} from 'react-native'
import {ReactRenderer} from '@tiptap/react'
import tippy, {Instance as TippyInstance} from 'tippy.js'
import {
  SuggestionOptions,
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {usePalette} from 'lib/hooks/usePalette'
import Graphemer from 'graphemer'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'

interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export function createSuggestion({
  autocompleteView,
}: {
  autocompleteView: UserAutocompleteModel
}): Omit<SuggestionOptions, 'editor'> {
  return {
    async items({query}) {
      autocompleteView.setActive(true)
      await autocompleteView.setPrefix(query)
      return autocompleteView.suggestions.slice(0, 8)
    },

    render: () => {
      let component: ReactRenderer<MentionListRef> | undefined
      let popup: TippyInstance[] | undefined

      return {
        onStart: props => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

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

          if (!props.clientRect) {
            return
          }

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

const MentionList = forwardRef<MentionListRef, SuggestionProps>(
  (props: SuggestionProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const pal = usePalette('default')
    const splitter = useMemo(() => new Graphemer(), [])

    const selectItem = (index: number) => {
      const item = props.items[index]

      if (item) {
        props.command({id: item.handle})
      }
    }

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length,
      )
    }

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({event}) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }))

    const {items} = props

    const getDisplayedName = useCallback(
      (name: string) => {
        // Heuristic value based on max display name and handle lengths
        const DISPLAY_LIMIT = 30
        if (name.length > DISPLAY_LIMIT) {
          const graphemes = splitter.splitGraphemes(name)

          if (graphemes.length > DISPLAY_LIMIT) {
            return graphemes.length > DISPLAY_LIMIT
              ? `${graphemes.slice(0, DISPLAY_LIMIT).join('')}...`
              : name.substring(0, DISPLAY_LIMIT)
          }
        }

        return name
      },
      [splitter],
    )

    return (
      <div className="items">
        <View style={[pal.borderDark, pal.view, styles.container]}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const displayName = getDisplayedName(
                item.displayName ?? item.handle,
              )
              const isSelected = selectedIndex === index

              return (
                <View
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
                  ]}>
                  <View style={styles.avatarAndDisplayName}>
                    <UserAvatar avatar={item.avatar ?? null} size={26} />
                    <Text style={pal.text} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </View>
                  <Text type="xs" style={pal.textLight} numberOfLines={1}>
                    {item.handle}
                  </Text>
                </View>
              )
            })
          ) : (
            <Text type="sm" style={[pal.text, styles.noResult]}>
              No result
            </Text>
          )}
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
