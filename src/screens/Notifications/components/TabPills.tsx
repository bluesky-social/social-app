import {useEffect, useRef, useState} from 'react'
import {
  type ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
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
  onSelectTab,
  contentContainerStyle,
  gutterWidth = tokens.space.lg,
}: {
  tabs: TabPillItem[]
  selectedTab: string
  onSelectTab: (tab: string) => void
  contentContainerStyle?: StyleProp<ViewStyle>
  gutterWidth?: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const listRef = useRef<ScrollView>(null)
  const [totalWidth, setTotalWidth] = useState(0)
  const [scrollX, setScrollX] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const pendingTabOffsets = useRef<{x: number; width: number}[]>([])
  const [tabOffsets, setTabOffsets] = useState<{x: number; width: number}[]>([])

  const onInitialLayout = useNonReactiveCallback(() => {
    scrollIntoViewIfNeeded(tabs.findIndex(tab => tab.key === selectedTab))
  })

  useEffect(() => {
    if (tabOffsets) {
      onInitialLayout()
    }
  }, [tabOffsets, onInitialLayout])

  function scrollIntoViewIfNeeded(index: number) {
    const btnLayout = tabOffsets[index]
    if (!btnLayout) return
    listRef.current?.scrollTo({
      x: btnLayout.x - (totalWidth / 2 - btnLayout.width / 2),
      animated: true,
    })
  }

  function handleSelectTab(index: number) {
    const tab = tabs[index]
    onSelectTab(tab.key)
    scrollIntoViewIfNeeded(index)
  }

  function handleTabLayout(index: number, x: number, width: number) {
    if (!tabOffsets.length) {
      pendingTabOffsets.current[index] = {x, width}
      if (
        pendingTabOffsets.current.filter(offset => !!offset).length ===
        tabs.length
      ) {
        setTabOffsets(pendingTabOffsets.current)
      }
    }
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
    <View style={[a.relative, a.flex_row]}>
      <BlockDrawerGesture>
        <DraggableScrollView
          ref={listRef}
          contentContainerStyle={[
            a.gap_sm,
            {paddingHorizontal: gutterWidth},
            contentContainerStyle,
          ]}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={
            tabOffsets.filter(offset => !!offset).length === tabs.length
              ? tabOffsets.map(offset => offset.x - tokens.space.xl)
              : undefined
          }
          onLayout={event => setTotalWidth(event.nativeEvent.layout.width)}
          onContentSizeChange={width => setContentWidth(width)}
          onScroll={event => {
            setScrollX(event.nativeEvent.contentOffset.x)
          }}
          scrollEventThrottle={16}>
          {tabs.map((tab, index) => (
            <TabPill
              key={tab.key}
              tab={tab}
              index={index}
              active={tab.key === selectedTab}
              onSelectTab={handleSelectTab}
              onLayout={handleTabLayout}
            />
          ))}
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
            ]}>
            <ButtonIcon icon={ArrowRight} />
          </Button>
        </View>
      )}
    </View>
  )
}

function TabPill({
  tab,
  active,
  index,
  onSelectTab,
  onLayout,
}: {
  tab: TabPillItem
  active: boolean
  index: number
  onSelectTab: (index: number) => void
  onLayout: (index: number, x: number, width: number) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View
      onLayout={event =>
        onLayout(
          index,
          event.nativeEvent.layout.x,
          event.nativeEvent.layout.width,
        )
      }>
      <Button
        label={
          active ? l`${tab.label} tab, selected` : l`Select ${tab.label} tab`
        }
        accessibilityRole="tab"
        accessibilityState={{selected: active}}
        onPress={() => onSelectTab(index)}>
        <View
          style={[
            a.rounded_full,
            a.px_lg,
            a.py_sm,
            {borderWidth: 1},
            active
              ? [t.atoms.bg_contrast_50, {borderColor: t.palette.contrast_50}]
              : [a.bg_transparent, t.atoms.border_contrast_low],
          ]}>
          <Text
            style={[
              a.font_medium,
              active ? t.atoms.text : t.atoms.text_contrast_high,
            ]}>
            {tab.label}
          </Text>
        </View>
      </Button>
    </View>
  )
}
