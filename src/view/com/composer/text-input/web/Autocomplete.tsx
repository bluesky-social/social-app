import {forwardRef, useEffect, useImperativeHandle, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/macro'
import {ReactRenderer} from '@tiptap/react'
import {
  SuggestionKeyDownProps,
  SuggestionOptions,
  SuggestionProps,
} from '@tiptap/suggestion'
import tippy, {Instance as TippyInstance} from 'tippy.js'

import {usePalette} from '#/lib/hooks/usePalette'
import {ActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {useGrapheme} from '../hooks/useGrapheme'

interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export function createSuggestion({
  autocomplete,
}: {
  autocomplete: ActorAutocompleteFn
}): Omit<SuggestionOptions, 'editor'> {
  return {
    async items({query}) {
      const suggestions = await autocomplete({query})
      return suggestions.slice(0, 8)
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
  function MentionListImpl(props: SuggestionProps, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const pal = usePalette('default')
    const {getGraphemeString} = useGrapheme()

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

        if (event.key === 'Enter' || event.key === 'Tab') {
          enterHandler()
          return true
        }

        return false
      },
    }))

    const {items} = props

    return (
      <div className="items">
        <View style={[pal.borderDark, pal.view, styles.container]}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const {name: displayName} = getGraphemeString(
                item.displayName ?? item.handle,
                30, // Heuristic value; can be modified
              )
              const isSelected = selectedIndex === index

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
                    selectItem(index)
                  }}
                  accessibilityRole="button">
                  <View style={styles.avatarAndDisplayName}>
                    <UserAvatar
                      avatar={item.avatar ?? null}
                      size={26}
                      type={item.associated?.labeler ? 'labeler' : 'user'}
                    />
                    <Text emoji style={pal.text} numberOfLines={1}>
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
              <Trans>No result</Trans>
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
