import {forwardRef, useEffect, useImperativeHandle, useState} from 'react'
import {Pressable, View} from 'react-native'
import {type AppBskyActorDefs, type ModerationOpts} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {ReactRenderer} from '@tiptap/react'
import {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion'
import tippy, {type Instance as TippyInstance} from 'tippy.js'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type ActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {atoms as a, useTheme} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export interface AutocompleteRef {
  maybeClose: () => boolean
}

export function createSuggestion({
  autocomplete,
  autocompleteRef,
}: {
  autocomplete: ActorAutocompleteFn
  autocompleteRef: React.Ref<AutocompleteRef>
}): Omit<SuggestionOptions, 'editor'> {
  return {
    async items({query}) {
      const suggestions = await autocomplete({query})
      return suggestions.slice(0, 8)
    },

    render: () => {
      let component: ReactRenderer<MentionListRef> | undefined
      let popup: TippyInstance[] | undefined

      const hide = () => {
        popup?.[0]?.destroy()
        component?.destroy()
      }

      return {
        onStart: props => {
          component = new ReactRenderer(MentionList, {
            props: {...props, autocompleteRef, hide},
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
            return false
          }

          return component?.ref?.onKeyDown(props) || false
        },

        onExit() {
          hide()
        },
      }
    },
  }
}

const MentionList = forwardRef<
  MentionListRef,
  SuggestionProps & {
    autocompleteRef: React.Ref<AutocompleteRef>
    hide: () => void
  }
>(function MentionListImpl({items, command, hide, autocompleteRef}, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  const selectItem = (index: number) => {
    const item = items[index]

    if (item) {
      command({id: item.handle})
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [items])

  useImperativeHandle(autocompleteRef, () => ({
    maybeClose: () => {
      hide()
      return true
    },
  }))

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

  if (!moderationOpts) return null

  return (
    <div className="items">
      <View
        style={[
          t.atoms.border_contrast_low,
          t.atoms.bg,
          a.rounded_sm,
          a.border,
          a.p_xs,
          {width: 300},
        ]}>
        {items.length > 0 ? (
          items.map((item, index) => {
            const isSelected = selectedIndex === index

            return (
              <AutocompleteProfileCard
                key={item.handle}
                profile={item}
                isSelected={isSelected}
                onPress={() => selectItem(index)}
                onHover={() => setSelectedIndex(index)}
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
})

function AutocompleteProfileCard({
  profile,
  isSelected,
  onPress,
  onHover,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  isSelected: boolean
  onPress: () => void
  onHover: () => void
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()

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
      onPointerEnter={onHover}
      accessibilityRole="button">
      <View style={[a.flex_1]}>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
            disabledPreview
          />
          <ProfileCard.NameAndHandle
            profile={profile}
            moderationOpts={moderationOpts}
          />
        </ProfileCard.Header>
      </View>
    </Pressable>
  )
}
