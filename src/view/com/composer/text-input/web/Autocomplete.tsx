import {forwardRef, useEffect, useImperativeHandle, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {
  type AppBskyActorDefs,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {ReactRenderer} from '@tiptap/react'
import {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion'
import tippy, {type Instance as TippyInstance} from 'tippy.js'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type ActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {useGrapheme} from '#/view/com/composer/text-input/hooks/useGrapheme'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'

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
    const t = useTheme()
    const moderationOpts = useModerationOpts()

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

    if (!moderationOpts) return null

    return (
      <div className="items">
        <View
          style={[t.atoms.border_contrast_low, t.atoms.bg, styles.container]}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const isSelected = selectedIndex === index

              return (
                <AutocompleteProfileCard
                  key={item.handle}
                  profile={item}
                  isSelected={isSelected}
                  onPress={() => selectItem(index)}
                  moderationOpts={moderationOpts}
                />
              )
            })
          ) : (
            <Text style={[a.text_sm, a.px_md, a.py_md]}>
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
  onPress,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  isSelected: boolean
  onPress: () => void
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const {getGraphemeString} = useGrapheme()
  const {name: displayName} = getGraphemeString(
    sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle)),
    30, // Heuristic value; can be modified
  )
  const state = useSimpleVerificationState({profile})
  const moderation = moderateProfile(profile, moderationOpts)
  return (
    <Pressable
      style={[
        isSelected && t.atoms.bg_contrast_25,
        a.align_center,
        a.justify_between,
        a.flex_row,
        a.px_md,
        a.py_sm,
        a.gap_2xl,
        a.rounded_xs,
        a.transition_color,
      ]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={[a.flex_1, a.align_center, a.gap_sm, a.flex_row]}>
        <UserAvatar
          avatar={profile.avatar ?? null}
          size={26}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
          moderation={moderation.ui('avatar')}
        />
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
          <Text emoji style={[a.text_sm, a.leading_snug]} numberOfLines={1}>
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
      <View style={[a.flex_1]}>
        <Text
          style={[
            a.text_sm,
            a.leading_snug,
            t.atoms.text_contrast_medium,
            a.text_right,
          ]}
          numberOfLines={1}>
          {sanitizeHandle(profile.handle, '@')}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 500,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 4,
  },
})
