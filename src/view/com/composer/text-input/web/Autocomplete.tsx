import {forwardRef, useEffect, useImperativeHandle, useState} from 'react'
import {Pressable, View} from 'react-native'
import {type AppBskyActorDefs, type ModerationOpts} from '@atproto/api'
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom'
import {Trans} from '@lingui/macro'
import {ReactRenderer} from '@tiptap/react'
import {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion'

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
      let floatingEl: HTMLDivElement | undefined
      let cleanupAutoUpdate: (() => void) | undefined
      let latestClientRect: (() => DOMRect | null) | null = null

      const hide = () => {
        cleanupAutoUpdate?.()
        cleanupAutoUpdate = undefined
        if (floatingEl) {
          floatingEl.remove()
          floatingEl = undefined
        }
        component?.destroy()
      }

      const updatePosition = () => {
        if (!floatingEl || !latestClientRect) return
        const rect = latestClientRect()
        if (!rect) return

        const virtualEl = {
          getBoundingClientRect: () => rect,
        }

        computePosition(virtualEl, floatingEl, {
          placement: 'bottom-start',
          middleware: [offset(8), flip(), shift({padding: 8})],
        }).then(({x, y}) => {
          if (floatingEl) {
            Object.assign(floatingEl.style, {
              left: `${x}px`,
              top: `${y}px`,
            })
          }
        })
      }

      return {
        onStart: props => {
          component = new ReactRenderer(MentionList, {
            props: {...props, autocompleteRef, hide},
            editor: props.editor,
          })

          floatingEl = document.createElement('div')
          floatingEl.style.position = 'absolute'
          floatingEl.style.zIndex = '1000'
          floatingEl.style.width = 'fit-content'
          if (component.element) {
            floatingEl.appendChild(component.element)
          }
          document.body.appendChild(floatingEl)

          latestClientRect = props.clientRect ?? null

          if (latestClientRect && floatingEl) {
            const rect = latestClientRect()
            if (rect) {
              const virtualEl = {
                getBoundingClientRect: () => rect,
              }
              cleanupAutoUpdate = autoUpdate(
                virtualEl,
                floatingEl,
                updatePosition,
              )
            }
          }
        },

        onUpdate(props) {
          component?.updateProps(props)
          latestClientRect = props.clientRect ?? null
          updatePosition()
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
>(function MentionListImpl(
  {items, command, query, hide, autocompleteRef},
  ref,
) {
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
            {query ? <Trans>No result</Trans> : <Trans>Keep typing...</Trans>}
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
