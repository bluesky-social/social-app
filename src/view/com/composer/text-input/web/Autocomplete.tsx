import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import {ReactRenderer} from '@tiptap/react'
import tippy, {Instance as TippyInstance} from 'tippy.js'
import {
  SuggestionOptions,
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'

interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export function createSuggestion({
  autocompleteView,
}: {
  autocompleteView: UserAutocompleteViewModel
}): Omit<SuggestionOptions, 'editor'> {
  return {
    async items({query}) {
      autocompleteView.setActive(true)
      await autocompleteView.setPrefix(query)
      return autocompleteView.suggestions.slice(0, 8).map(s => s.handle)
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

    const selectItem = (index: number) => {
      const item = props.items[index]

      if (item) {
        props.command({id: item})
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

    return (
      <div className="items">
        {props.items.length ? (
          props.items.map((item, index) => (
            <button
              className={`item ${index === selectedIndex ? 'is-selected' : ''}`}
              key={index}
              onClick={() => selectItem(index)}>
              {item}
            </button>
          ))
        ) : (
          <div className="item">No result</div>
        )}
      </div>
    )
  },
)
