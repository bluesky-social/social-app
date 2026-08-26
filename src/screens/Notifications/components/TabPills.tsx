import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {
  Pressable,
  type ReactNativeElement,
  type ScrollView,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

import {DraggableScrollView} from '#/view/com/pager/DraggableScrollView'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens, useTheme, utils, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {
  ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft,
  ArrowRight_Stroke2_Corner0_Rounded as ArrowRight,
} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

export type TabPillItem = {
  key: string
  label: string
}

export function TabPills({
  tabs,
  selectedTab,
  dragProgress,
  onSelectTab,
  contentContainerStyle,
  gutterWidth = tokens.space.lg,
}: {
  tabs: TabPillItem[]
  selectedTab: string
  dragProgress: SharedValue<number>
  onSelectTab: (tab: string) => void
  contentContainerStyle?: StyleProp<ViewStyle>
  gutterWidth?: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {width: windowWidth} = useWindowDimensions()
  const listRef = useRef<ScrollView & ReactNativeElement>(null)
  const [totalWidth, setTotalWidth] = useState(0)
  const [scrollX, setScrollX] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const [tabOffsets, setTabOffsets] = useState<PillLayout[]>([])
  const contentRef = useRef<View>(null)
  const tabRefs = useRef<Array<View | null>>([])
  const didMeasure = useRef(false)
  const tabLayoutKey = tabs.map(tab => `${tab.key}:${tab.label}`).join('|')
  const tabCount = tabs.length

  useLayoutEffect(() => {
    const viewportRect = listRef.current?.getBoundingClientRect()
    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!viewportRect || !contentRect) return

    const layouts = Array.from({length: tabCount}, (_, index) => {
      const rect = tabRefs.current[index]?.getBoundingClientRect()
      if (!rect) return null
      return {
        x: rect.left - contentRect.left,
        y: rect.top - contentRect.top,
        width: rect.width,
        height: rect.height,
      }
    })
    if (layouts.some(layout => layout === null)) return

    const nextLayouts = layouts as PillLayout[]
    setTabOffsets(current =>
      areLayoutsEqual(current, nextLayouts) ? current : nextLayouts,
    )
    if (IS_WEB) {
      setTotalWidth(viewportRect.width)
      setContentWidth(contentRect.width)
    }

    const selectedIndex = tabs.findIndex(tab => tab.key === selectedTab)
    const selectedLayout = nextLayouts[selectedIndex]
    if (selectedLayout) {
      const centeredOffset =
        selectedLayout.x - (viewportRect.width / 2 - selectedLayout.width / 2)
      const maxOffset = Math.max(0, contentRect.width - viewportRect.width)
      listRef.current?.scrollTo({
        x: Math.min(maxOffset, Math.max(0, centeredOffset)),
        animated: didMeasure.current,
      })
    }
    didMeasure.current = true
  }, [selectedTab, tabLayoutKey, tabCount, tabs, windowWidth])

  function handleSelectTab(index: number) {
    const tab = tabs[index]
    onSelectTab(tab.key)
  }

  const canScrollLeft = scrollX > 0
  const canScrollRight = Math.ceil(scrollX) < contentWidth - totalWidth
  const cleanupRef = useRef<(() => void) | null>(null)
  const isContinuouslyScrollingRef = useRef(false)

  function scrollLeft() {
    if (isContinuouslyScrollingRef.current) return
    if (listRef.current && canScrollLeft) {
      listRef.current.scrollTo({x: Math.max(0, scrollX - 200), animated: true})
    }
  }

  function scrollRight() {
    if (isContinuouslyScrollingRef.current) return
    if (listRef.current && canScrollRight) {
      const maxScroll = contentWidth - totalWidth
      listRef.current.scrollTo({
        x: Math.min(maxScroll, scrollX + 200),
        animated: true,
      })
    }
  }

  function startContinuousScroll(direction: 'left' | 'right') {
    cleanupRef.current?.()

    let holdTimeout: NodeJS.Timeout | null = null
    let animationFrame: number | null = null
    let isActive = true
    isContinuouslyScrollingRef.current = false

    const cleanup = () => {
      isActive = false
      if (holdTimeout) clearTimeout(holdTimeout)
      if (animationFrame) cancelAnimationFrame(animationFrame)
      cleanupRef.current = null
      setTimeout(() => {
        isContinuouslyScrollingRef.current = false
      }, 100)
    }

    cleanupRef.current = cleanup
    holdTimeout = setTimeout(() => {
      if (!isActive) return

      isContinuouslyScrollingRef.current = true
      let currentScrollPosition = scrollX

      const scroll = () => {
        if (!isActive || !listRef.current) return

        const scrollAmount = 3
        const maxScroll = contentWidth - totalWidth
        let newScrollX: number
        let canContinue = false

        if (direction === 'left' && currentScrollPosition > 0) {
          newScrollX = Math.max(0, currentScrollPosition - scrollAmount)
          canContinue = newScrollX > 0
        } else if (direction === 'right' && currentScrollPosition < maxScroll) {
          newScrollX = Math.min(maxScroll, currentScrollPosition + scrollAmount)
          canContinue = newScrollX < maxScroll
        } else {
          return
        }

        currentScrollPosition = newScrollX
        listRef.current.scrollTo({x: newScrollX, animated: false})

        if (canContinue && isActive) {
          animationFrame = requestAnimationFrame(scroll)
        }
      }

      scroll()
    }, 500)
  }

  function stopContinuousScroll() {
    cleanupRef.current?.()
  }

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  return (
    <View style={[a.relative, a.flex_row]} accessibilityRole="tablist">
      <BlockDrawerGesture>
        <DraggableScrollView
          ref={listRef}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={
            tabOffsets.filter(offset => !!offset).length === tabs.length
              ? tabOffsets.map(offset => offset.x - tokens.space.xl)
              : undefined
          }
          onScroll={
            IS_WEB
              ? event => setScrollX(event.nativeEvent.contentOffset.x)
              : undefined
          }
          scrollEventThrottle={IS_WEB ? 16 : undefined}>
          <View
            ref={contentRef}
            style={[
              a.flex_row,
              a.gap_sm,
              {paddingHorizontal: gutterWidth},
              contentContainerStyle,
            ]}>
            {tabs.map((tab, index) => (
              <TabPill
                key={tab.key}
                elementRef={element => {
                  tabRefs.current[index] = element
                }}
                tab={tab}
                index={index}
                active={tab.key === selectedTab}
                onSelectTab={handleSelectTab}
              />
            ))}
            {tabOffsets.map((layout, index) => (
              <View
                key={`border-${tabs[index].key}`}
                accessible={false}
                pointerEvents="none"
                style={[
                  a.absolute,
                  a.rounded_full,
                  a.curve_continuous,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                  {
                    zIndex: 1,
                    borderWidth: 1,
                    left: layout.x,
                    top: layout.y,
                    width: layout.width,
                    height: layout.height,
                  },
                ]}></View>
            ))}
            {tabOffsets.length === tabs.length && (
              <PillIndicator
                layouts={tabOffsets}
                dragProgress={dragProgress}
                backgroundColor={t.atoms.bg_contrast_50.backgroundColor}
                borderColor={t.palette.contrast_50}
              />
            )}
            {tabOffsets.map((layout, index) => (
              <View
                key={`label-${tabs[index].key}`}
                aria-hidden
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
                style={[
                  a.absolute,
                  a.align_center,
                  a.justify_center,
                  {
                    zIndex: 3,
                    left: layout.x,
                    top: layout.y,
                    width: layout.width,
                    height: layout.height,
                  },
                ]}>
                <Text
                  style={[
                    a.font_medium,
                    tabs[index].key === selectedTab
                      ? t.atoms.text
                      : t.atoms.text_contrast_high,
                  ]}>
                  {tabs[index].label}
                </Text>
              </View>
            ))}
          </View>
        </DraggableScrollView>
      </BlockDrawerGesture>

      {IS_WEB && canScrollLeft && (
        <View
          style={[
            a.absolute,
            a.top_0,
            a.left_0,
            a.bottom_0,
            a.justify_center,
            {paddingLeft: gutterWidth},
            a.pr_md,
            a.z_10,
            web({
              background: `linear-gradient(to right, ${t.atoms.bg.backgroundColor} 0%, ${t.atoms.bg.backgroundColor} 70%, ${utils.alpha(t.atoms.bg.backgroundColor, 0)} 100%)`,
            }),
          ]}>
          <Button
            label={l`Scroll left`}
            onPress={scrollLeft}
            onPressIn={() => startContinuousScroll('left')}
            onPressOut={stopContinuousScroll}
            color="secondary"
            size="small"
            style={[
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg,
              a.h_full,
              a.aspect_square,
              a.rounded_full,
              a.curve_continuous,
            ]}>
            <ButtonIcon icon={ArrowLeft} />
          </Button>
        </View>
      )}

      {IS_WEB && canScrollRight && (
        <View
          style={[
            a.absolute,
            a.top_0,
            a.right_0,
            a.bottom_0,
            a.justify_center,
            {paddingRight: gutterWidth},
            a.pl_md,
            a.z_10,
            web({
              background: `linear-gradient(to left, ${t.atoms.bg.backgroundColor} 0%, ${t.atoms.bg.backgroundColor} 70%, ${utils.alpha(t.atoms.bg.backgroundColor, 0)} 100%)`,
            }),
          ]}>
          <Button
            label={l`Scroll right`}
            onPress={scrollRight}
            onPressIn={() => startContinuousScroll('right')}
            onPressOut={stopContinuousScroll}
            color="secondary"
            size="small"
            style={[
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg,
              a.h_full,
              a.aspect_square,
              a.rounded_full,
              a.curve_continuous,
            ]}>
            <ButtonIcon icon={ArrowRight} />
          </Button>
        </View>
      )}
    </View>
  )
}

function TabPill({
  elementRef,
  tab,
  active,
  index,
  onSelectTab,
}: {
  elementRef: React.Ref<View>
  tab: TabPillItem
  active: boolean
  index: number
  onSelectTab: (index: number) => void
}) {
  const {t: l} = useLingui()

  return (
    <View ref={elementRef}>
      <Pressable
        accessibilityLabel={
          active ? l`${tab.label} tab, selected` : l`Select ${tab.label} tab`
        }
        accessibilityHint={l`Shows ${tab.label} notifications`}
        accessibilityRole="tab"
        accessibilityState={{selected: active}}
        onPress={() => onSelectTab(index)}
        style={[a.rounded_full, a.curve_continuous]}>
        <View
          style={[
            a.rounded_full,
            a.curve_continuous,
            a.px_lg,
            a.py_sm,
            a.bg_transparent,
            {borderWidth: 1, borderColor: 'transparent'},
          ]}>
          <Text accessible={false} style={[a.font_medium, {opacity: 0}]}>
            {tab.label}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

type PillLayout = {
  x: number
  y: number
  width: number
  height: number
}

function areLayoutsEqual(a: PillLayout[], b: PillLayout[]) {
  return (
    a.length === b.length &&
    a.every(
      (layout, index) =>
        layout.x === b[index].x &&
        layout.y === b[index].y &&
        layout.width === b[index].width &&
        layout.height === b[index].height,
    )
  )
}

function PillIndicator({
  layouts,
  dragProgress,
  backgroundColor,
  borderColor,
}: {
  layouts: PillLayout[]
  dragProgress: SharedValue<number>
  backgroundColor: string
  borderColor: string
}) {
  const height = layouts[0].height
  const radius = height / 2
  const inputRange = layouts.map((_, index) => index)
  const xOutputRange = layouts.map(layout => layout.x)
  const widthOutputRange = layouts.map(layout => layout.width)

  const geometry = useDerivedValue(() => {
    const progress = dragProgress.get()
    return {
      x: interpolate(progress, inputRange, xOutputRange, 'clamp'),
      width: interpolate(progress, inputRange, widthOutputRange, 'clamp'),
    }
  })

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: geometry.get().x}],
  }))
  const middleStyle = useAnimatedStyle(() => ({
    transform: [{scaleX: Math.max(0.01, geometry.get().width - height)}],
  }))
  const rightCapStyle = useAnimatedStyle(() => ({
    transform: [{translateX: geometry.get().width - radius - 1}],
  }))

  return (
    <Animated.View
      accessible={false}
      pointerEvents="none"
      style={[
        a.absolute,
        a.curve_continuous,
        {
          zIndex: 1,
          top: layouts[0].y,
          left: 0,
          width: radius + 1,
          height,
        },
        containerStyle,
      ]}>
      <View
        style={[
          a.curve_continuous,
          a.absolute,
          a.top_0,
          a.left_0,
          {
            width: radius + 1,
            height,
            backgroundColor,
            borderColor,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
          },
        ]}
      />
      <Animated.View
        style={[
          a.curve_continuous,
          a.absolute,
          a.top_0,
          {
            left: radius,
            width: 1,
            height,
            transformOrigin: 'left center',
            backgroundColor,
            borderColor,
            borderTopWidth: 1,
            borderBottomWidth: 1,
          },
          middleStyle,
        ]}
      />
      <Animated.View
        style={[
          a.curve_continuous,
          a.absolute,
          a.top_0,
          a.left_0,
          {
            width: radius + 1,
            height,
            backgroundColor,
            borderColor,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderTopRightRadius: radius,
            borderBottomRightRadius: radius,
          },
          rightCapStyle,
        ]}
      />
    </Animated.View>
  )
}
