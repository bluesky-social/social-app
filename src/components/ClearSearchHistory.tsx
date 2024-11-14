import React, {useCallback,useEffect, useRef, useState} from 'react'
import {Animated, Pressable} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

interface ClearButtonProps {
  onClear: () => void
}

export const ClearButton = ({onClear}: ClearButtonProps): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const [isExpanded, setIsExpanded] = useState(false)
  const widthAnim = useRef(new Animated.Value(32)).current
  const fadeIconAnim = useRef(new Animated.Value(1)).current
  const fadeTextAnim = useRef(new Animated.Value(0)).current
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>()

  const animate = useCallback(
    (expand: boolean) => {
      Animated.parallel([
        Animated.spring(widthAnim, {
          toValue: expand ? 65 : 32,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(fadeIconAnim, {
          toValue: expand ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeTextAnim, {
          toValue: expand ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    },
    [widthAnim, fadeIconAnim, fadeTextAnim],
  )

  const toggleExpand = (event: any) => {
    event?.stopPropagation?.()
    if (!isExpanded) {
      setIsExpanded(true)
      animate(true)
      timeoutRef.current = setTimeout(() => {
        collapse()
      }, 5000)
    } else {
      handleClear()
    }
  }

  const collapse = useCallback(() => {
    animate(false)
    setTimeout(() => setIsExpanded(false), 300)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [animate])

  const handleClear = () => {
    onClear()
    collapse()
  }

  useEffect(() => {
    if (!isWeb || !isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      const element = event.target as Element
      if (element.closest('[data-testid="clearHistoryBtn"]')) return
      collapse()
    }

    requestAnimationFrame(() => {
      window.addEventListener('click', handleClickOutside)
    })

    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  }, [collapse, isExpanded])

  return (
    <Pressable
      testID="clearHistoryBtn"
      onPress={toggleExpand}
      hitSlop={HITSLOP_10}
      accessibilityLabel={_(msg`Clear all recent searches`)}
      accessibilityHint={_(
        msg`Removes all search history and recently viewed profiles`,
      )}
      style={[a.flex_row, a.justify_end]}>
      <Animated.View
        style={{
          width: widthAnim,
        }}>
        <Animated.View
          style={[
            a.rounded_full,
            {
              backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
              height: 28,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
            },
          ]}>
          <Animated.View
            style={{
              opacity: fadeIconAnim,
              position: 'absolute',
            }}>
            <ButtonIcon icon={X} size="xs" />
          </Animated.View>
          <Animated.View
            style={{
              opacity: fadeTextAnim,
              position: 'absolute',
            }}>
            <Text style={[{color: t.atoms.text.color}]}>Clear</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}
