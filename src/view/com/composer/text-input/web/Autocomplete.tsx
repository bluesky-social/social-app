import {forwardRef, useEffect, useImperativeHandle, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {ReactRenderer} from '@tiptap/react'
import {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion'
import tippy, {type Instance as TippyInstance} from 'tippy.js'

import {usePalette} from '#/lib/hooks/usePalette'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type ActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
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
              const isSelected = selectedIndex === index

              return (
                <AutocompleteProfileCard
                  key={item.handle}
                  profile={item}
                  isSelected={isSelected}
                  itemIndex={index}
                  totalItems={items.length}
                  onPress={() => {
                    selectItem(index)
                  }}
                />
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

function AutocompleteProfileCard({
  profile,
  isSelected,
  itemIndex,
  totalItems,
  onPress,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  isSelected: boolean
  itemIndex: number
  totalItems: number
  onPress: () => void
}) {
  const pal = usePalette('default')
  const {getGraphemeString} = useGrapheme()
  const {name: displayName} = getGraphemeString(
    sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle)),
    30, // Heuristic value; can be modified
  )
  const state = useSimpleVerificationState({
    profile,
  })
  return (
    <Pressable
      style={[
        isSelected ? pal.viewLight : undefined,
        pal.borderDark,
        styles.mentionContainer,
        itemIndex === 0
          ? styles.firstMention
          : itemIndex === totalItems - 1
          ? styles.lastMention
          : undefined,
      ]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={[styles.avatarAndDisplayName, a.flex_1]}>
        <UserAvatar
          avatar={profile.avatar ?? null}
          size={26}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
        />
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
          <Text emoji style={[pal.text]} numberOfLines={1}>
            {displayName}
          </Text>
          {state.isVerified && (
            <View>
              <VerificationCheck
                width={12}
                verifier={state.role === 'verifier'}
              />
            </View>
          )}
        </View>
      </View>
      <View>
        <Text type="xs" style={pal.textLight} numberOfLines={1}>
          {sanitizeHandle(profile.handle, '@')}
        </Text>
      </View>
    </Pressable>
  )
}

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
    gap: 16,
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
