import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Animated, Pressable} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

export const ClearButton = ({
  onClear,
}: {
  onClear: () => void
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const [isExpanded, setIsExpanded] = useState(false)
  const animations = useRef({
    width: new Animated.Value(32),
    iconOpacity: new Animated.Value(1),
    textOpacity: new Animated.Value(0),
  }).current
  const timeoutRef = useRef<NodeJS.Timeout>()

  const animate = useCallback(
    (expand: boolean) => {
      Animated.parallel([
        Animated.spring(animations.width, {
          toValue: expand ? 65 : 32,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(animations.iconOpacity, {
          toValue: expand ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animations.textOpacity, {
          toValue: expand ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    },
    [animations],
  )

  const collapse = useCallback(() => {
    animate(false)
    setTimeout(() => setIsExpanded(false), 300)
    clearTimeout(timeoutRef.current)
  }, [animate])

  const handlePress = useCallback(
    (event?: any) => {
      event?.stopPropagation?.()
      if (!isExpanded) {
        setIsExpanded(true)
        animate(true)
        timeoutRef.current = setTimeout(collapse, 5000)
      } else {
        onClear()
        collapse()
      }
    },
    [isExpanded, animate, collapse, onClear],
  )

  useEffect(() => {
    if (!isWeb || !isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        !(event.target as Element).closest('[data-testid="clearHistoryBtn"]')
      ) {
        collapse()
      }
    }

    requestAnimationFrame(() =>
      window.addEventListener('click', handleClickOutside),
    )
    return () => window.removeEventListener('click', handleClickOutside)
  }, [collapse, isExpanded])

  return (
    <Pressable
      testID="clearHistoryBtn"
      onPress={handlePress}
      hitSlop={HITSLOP_10}
      accessibilityLabel={_(msg`Clear all recent searches`)}
      accessibilityHint={_(
        msg`Removes all search history and recently viewed profiles`,
      )}
      style={[a.flex_row, a.justify_end]}>
      <Animated.View style={{width: animations.width}}>
        <Animated.View
          style={[
            a.rounded_full,
            {
              backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
              height: 28,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
              width: '100%',
            },
          ]}>
          <Animated.View
            style={{opacity: animations.iconOpacity, position: 'absolute'}}>
            <ButtonIcon icon={X} size="xs" />
          </Animated.View>
          <Animated.View
            style={{opacity: animations.textOpacity, position: 'absolute'}}>
            <Text style={{color: t.atoms.text.color}}>Clear</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}
