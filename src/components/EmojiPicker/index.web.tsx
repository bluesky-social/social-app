import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {View} from 'react-native'
import {DropdownMenu} from 'radix-ui'

import {useA11y} from '#/state/a11y'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {atoms as a, flatten} from '#/alf'
import * as Menu from '../Menu'
import {useWebPreloadEmoji} from './preload'
import {
  type Emoji,
  type PickerProps,
  type RootProps,
  type TriggerProps,
} from './types'

export * from './types'

/**
 * The emoji-mart picker is code-split into its own chunk (`emoji-mart`) so its
 * weight stays out of the main bundle and is only fetched when the picker
 * actually mounts (i.e. when the dropdown opens). {@link useWebPreloadEmoji}
 * warms the same chunk ahead of time.
 */
const EmojiPickerLazy = lazy(
  () => import(/* webpackChunkName: "emoji-mart" */ '@emoji-mart/react'),
)

/**
 * Fixed-size placeholder shown while the emoji-mart chunk loads, sized to match
 * emoji-mart's default picker so the dropdown doesn't visually jump when the
 * real picker mounts.
 */
const PICKER_WIDTH = 352
const PICKER_HEIGHT = 435

const EmojiPickerContext = createContext<{
  onEmojiSelect: (emoji: Emoji) => void
  nextFocusRef: RootProps['nextFocusRef']
} | null>(null)

/**
 * Provides emoji picker context and wraps children in a {@link Menu.Root}.
 *
 * On emoji select, fires a `textInputWebEmitter` event (for web text inputs
 * that listen for emoji insertions) and forwards to the optional
 * `onEmojiSelect` callback.
 *
 * @platform web
 */
export function Root({
  children,
  control,
  onEmojiSelect,
  preloadOnMount = true,
  nextFocusRef,
}: RootProps) {
  useWebPreloadEmoji({immediate: preloadOnMount})

  const value = useMemo(
    () => ({
      onEmojiSelect: (emoji: Emoji) => {
        textInputWebEmitter.emit('emoji-inserted', emoji)

        if (onEmojiSelect) onEmojiSelect(emoji)
      },
      nextFocusRef,
    }),
    [onEmojiSelect, nextFocusRef],
  )

  return (
    <EmojiPickerContext value={value}>
      <Menu.Root control={control}>{children}</Menu.Root>
    </EmojiPickerContext>
  )
}

/**
 * Passthrough to {@link Menu.Trigger}. Accepts the same render-prop children
 * pattern.
 *
 * @platform web
 */
export function Trigger(props: TriggerProps) {
  return <Menu.Trigger {...props} />
}

/**
 * Renders the emoji picker inside a Radix `DropdownMenu.Portal`.
 *
 * Holding Shift while selecting an emoji keeps the picker open for
 * multi-select. Otherwise the menu closes after each selection.
 *
 * Must be rendered inside a {@link Root}.
 *
 * @platform web
 */
export function Picker({keepOpenWhenShiftHeld = true}: PickerProps) {
  const {onEmojiSelect, nextFocusRef} = useEmojiPickerContext()
  const {control} = Menu.useMenuContext()
  const {reduceMotionEnabled} = useA11y()
  const isShiftDown = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = true
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftDown.current = false
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [])

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={5}
        collisionPadding={{left: 5, right: 5, bottom: 5}}
        className="dropdown-menu-transform-origin dropdown-menu-constrain-size"
        onCloseAutoFocus={evt => {
          if (!nextFocusRef) return
          let element =
            nextFocusRef instanceof Function
              ? nextFocusRef()
              : nextFocusRef.current
          if (element) {
            evt.preventDefault()
            element.focus()
          }
        }}>
        <div
          onWheel={evt => evt.stopPropagation()}
          style={flatten([!reduceMotionEnabled && a.zoom_fade_in])}>
          <Suspense
            fallback={
              <View style={{width: PICKER_WIDTH, height: PICKER_HEIGHT}} />
            }>
            <EmojiPickerLazy
              autoFocus
              onEmojiSelect={(emoji: Emoji) => {
                onEmojiSelect(emoji)

                if (!keepOpenWhenShiftHeld || !isShiftDown.current) {
                  control.close()
                }
              }}
            />
          </Suspense>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

function useEmojiPickerContext() {
  const ctx = useContext(EmojiPickerContext)
  if (!ctx)
    throw new Error(
      'EmojiPicker.Picker must be used within an EmojiPicker.Root component',
    )
  return ctx
}
