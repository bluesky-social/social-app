import {
  Children,
  cloneElement,
  ReactNode,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  isValidElement,
  FunctionComponentElement,
} from 'react'
import {
  AccessibilityInfo,
  Pressable,
  View,
  Text,
  findNodeHandle,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useA11y} from '#/state/a11y'

export function FocusScope({children}: {children: ReactNode}) {
  const {screenReaderEnabled} = useA11y()

  return screenReaderEnabled ? <FocusTrap>{children}</FocusTrap> : children
}

function FocusTrap({children}: {children: ReactNode}) {
  const {_} = useLingui()
  const child = useRef<View>(null)

  const content = useMemo(() => {
    return Children.toArray(children).map((node, i) => {
      if (i === 0 && isValidElement(node)) {
        return cloneElement(node as FunctionComponentElement<any>, {
          ref: child,
        })
      }
      return node
    })
  }, [children])

  const focus = useCallback((ref: View | null) => {
    if (!ref) return
    const node = findNodeHandle(ref)
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      focus(child.current)
    }, 1e3)
  }, [focus])

  return (
    <>
      <Pressable
        accessible
        accessibilityLabel={_(
          msg`You've reached the start of the active content. Please go back, or activate to focus the first item.`,
        )}
        accessibilityActions={[{name: 'activate', label: 'activate'}]}
        onAccessibilityAction={event => {
          switch (event.nativeEvent.actionName) {
            case 'activate': {
              focus(child.current)
            }
          }
        }}>
        <Noop />
      </Pressable>
      {content}
      <Pressable
        accessibilityLabel={_(
          msg`You've reached the end of the active content. Please go back, or activate to go back to the beginning.`,
        )}
        accessibilityActions={[{name: 'activate', label: 'activate'}]}
        onAccessibilityAction={event => {
          switch (event.nativeEvent.actionName) {
            case 'activate': {
              focus(child.current)
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
