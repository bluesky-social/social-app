import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  Text,
  View,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useA11y} from '#/state/a11y'

/**
 * Conditionally wraps children in a `FocusTrap` component based on whether
 * screen reader support is enabled. THIS SHOULD BE USED SPARINGLY, only when
 * no better option is available.
 */
export function FocusScope({children}: {children: ReactNode}) {
  const {screenReaderEnabled} = useA11y()

  return screenReaderEnabled ? <FocusTrap>{children}</FocusTrap> : children
}

/**
 * `FocusTrap` is intended as a last-ditch effort to ensure that users keep
 * focus within a certain section of the app, like an overlay.
 *
 * It works by placing "guards" at the start and end of the active content.
 * Then when the user reaches either of those guards, it will announce that
 * they have reached the start or end of the content and tell them how to
 * remain within the active content section.
 */
function FocusTrap({children}: {children: ReactNode}) {
  const {_} = useLingui()
  const child = useRef<View>(null)

  /*
   * Here we add a ref to the first child of this component. This currently
   * overrides any ref already on that first child, so we throw an error here
   * to prevent us from ever accidentally doing this.
   */
  const decoratedChildren = useMemo(() => {
    return Children.toArray(children).map((node, i) => {
      if (i === 0 && isValidElement(node)) {
        const n = node as ReactElement<any>
        if (n.props.ref !== undefined) {
          throw new Error(
            'FocusScope needs to override the ref on its first child.',
          )
        }
        return cloneElement(n, {
          ...n.props,
          ref: child,
        })
      }
      return node
    })
  }, [children])

  const focusNode = useCallback((ref: View | null) => {
    if (!ref) return
    const node = findNodeHandle(ref)
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      focusNode(child.current)
    }, 1e3)
  }, [focusNode])

  return (
    <>
      <Pressable
        accessible
        accessibilityLabel={_(
          msg`You've reached the start of the active content.`,
        )}
        accessibilityHint={_(
          msg`Please go back, or activate this element to return to the start of the active content.`,
        )}
        accessibilityActions={[{name: 'activate', label: 'activate'}]}
        onAccessibilityAction={event => {
          switch (event.nativeEvent.actionName) {
            case 'activate': {
              focusNode(child.current)
            }
          }
        }}>
        <Noop />
      </Pressable>
      <View
        /**
         * This property traps focus effectively on iOS, but not on Android.
         */
        accessibilityViewIsModal>
        {decoratedChildren}
      </View>
      <Pressable
        accessibilityLabel={_(
          msg`You've reached the end of the active content.`,
        )}
        accessibilityHint={_(
          msg`Please go back, or activate this element to return to the start of the active content.`,
        )}
        accessibilityActions={[{name: 'activate', label: 'activate'}]}
        onAccessibilityAction={event => {
          switch (event.nativeEvent.actionName) {
            case 'activate': {
              focusNode(child.current)
            }
          }
        }}>
        <Noop />
      </Pressable>
    </>
  )
}

function Noop() {
  return (
    <Text
      accessible={false}
      style={{
        height: 1,
        opacity: 0,
      }}>
      {' '}
    </Text>
  )
}
