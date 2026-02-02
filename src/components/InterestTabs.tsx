import {useEffect, useRef, useState} from 'react'
import {
  type ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {DraggableScrollView} from '#/view/com/pager/DraggableScrollView'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {transparentifyColor} from '#/alf/util/colorGeneration'
import {Button, ButtonIcon} from '#/components/Button'
import {
  ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft,
  ArrowRight_Stroke2_Corner0_Rounded as ArrowRight,
} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

/**
 * Tab component that automatically scrolls the selected tab into view - used for interests
 * in the Find Follows dialog, Explore screen, etc.
 */
export function InterestTabs({
  onSelectTab,
  interests,
  selectedInterest,
  disabled,
  interestsDisplayNames,
  TabComponent = Tab,
  contentContainerStyle,
  gutterWidth = tokens.space.lg,
}: {
  onSelectTab: (tab: string) => void
  interests: string[]
  selectedInterest: string
  interestsDisplayNames: Record<string, string>
  /** still allows changing tab, but removes the active state from the selected tab */
  disabled?: boolean
  TabComponent?: React.ComponentType<React.ComponentProps<typeof Tab>>
  contentContainerStyle?: StyleProp<ViewStyle>
  gutterWidth?: number
}) {
  const t = useTheme()
  const {_} = useLingui()
  const listRef = useRef<ScrollView>(null)
  const [totalWidth, setTotalWidth] = useState(0)
  const [scrollX, setScrollX] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const pendingTabOffsets = useRef<{x: number; width: number}[]>([])
  const [tabOffsets, setTabOffsets] = useState<{x: number; width: number}[]>([])

  const onInitialLayout = useNonReactiveCallback(() => {
    const index = interests.indexOf(selectedInterest)
    scrollIntoViewIfNeeded(index)
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
      // centered
      x: btnLayout.x - (totalWidth / 2 - btnLayout.width / 2),
      animated: true,
    })
  }

  function handleSelectTab(index: number) {
    const tab = interests[index]
    onSelectTab(tab)
    scrollIntoViewIfNeeded(index)
  }

  function handleTabLayout(index: number, x: number, width: number) {
    if (!tabOffsets.length) {
      pendingTabOffsets.current[index] = {x, width}
      // not only do we check if the length is equal to the number of interests,
      // but we also need to ensure that the array isn't sparse. `.filter()`
      // removes any empty slots from the array
      if (
        pendingTabOffsets.current.filter(o => !!o).length === interests.length
      ) {
        setTabOffsets(pendingTabOffsets.current)
      }
    }
  }

  const canScrollLeft = scrollX > 0
  const canScrollRight = Math.ceil(scrollX) < contentWidth - totalWidth

  const cleanupRef = useRef<(() => void) | null>(null)

  function scrollLeft() {
    if (isContinuouslyScrollingRef.current) {
      return
    }
    if (listRef.current && canScrollLeft) {
      const newScrollX = Math.max(0, scrollX - 200)
      listRef.current.scrollTo({x: newScrollX, animated: true})
    }
  }

  function scrollRight() {
    if (isContinuouslyScrollingRef.current) {
      return
    }
    if (listRef.current && canScrollRight) {
      const maxScroll = contentWidth - totalWidth
      const newScrollX = Math.min(maxScroll, scrollX + 200)
      listRef.current.scrollTo({x: newScrollX, animated: true})
    }
  }

  const isContinuouslyScrollingRef = useRef(false)

  function startContinuousScroll(direction: 'left' | 'right') {
    // Clear any existing continuous scroll
    if (cleanupRef.current) {
      cleanupRef.current()
    }

    let holdTimeout: NodeJS.Timeout | null = null
    let animationFrame: number | null = null
    let isActive = true
    isContinuouslyScrollingRef.current = false

    const cleanup = () => {
      isActive = false
      if (holdTimeout) clearTimeout(holdTimeout)
      if (animationFrame) cancelAnimationFrame(animationFrame)
      cleanupRef.current = null
      // Reset flag after a delay to prevent onPress from firing
      setTimeout(() => {
        isContinuouslyScrollingRef.current = false
      }, 100)
    }

    cleanupRef.current = cleanup

    // Start continuous scrolling after hold delay
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
    if (cleanupRef.current) {
      cleanupRef.current()
    }
  }

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  return (
    <View style={[a.relative, a.flex_row]}>
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
          tabOffsets.filter(o => !!o).length === interests.length
            ? tabOffsets.map(o => o.x - tokens.space.xl)
            : undefined
        }
        onLayout={evt => setTotalWidth(evt.nativeEvent.layout.width)}
        onContentSizeChange={width => setContentWidth(width)}
        onScroll={evt => {
          const newScrollX = evt.nativeEvent.contentOffset.x
          setScrollX(newScrollX)
        }}
        scrollEventThrottle={16}>
        {interests.map((interest, i) => {
          const active = interest === selectedInterest && !disabled
          return (
            <TabComponent
              key={interest}
              onSelectTab={handleSelectTab}
              active={active}
              index={i}
              interest={interest}
              interestsDisplayName={interestsDisplayNames[interest]}
              onLayout={handleTabLayout}
            />
          )
        })}
      </DraggableScrollView>
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
              background: `linear-gradient(to right,  ${t.atoms.bg.backgroundColor} 0%, ${t.atoms.bg.backgroundColor} 70%, ${transparentifyColor(t.atoms.bg.backgroundColor, 0)} 100%)`,
            }),
          ]}>
          <Button
            label={_(msg`Scroll left`)}
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
              background: `linear-gradient(to left, ${t.atoms.bg.backgroundColor} 0%, ${t.atoms.bg.backgroundColor} 70%, ${transparentifyColor(t.atoms.bg.backgroundColor, 0)} 100%)`,
            }),
          ]}>
          <Button
            label={_(msg`Scroll right`)}
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

function Tab({
  onSelectTab,
  interest,
  active,
  index,
  interestsDisplayName,
  onLayout,
}: {
  onSelectTab: (index: number) => void
  interest: string
  active: boolean
  index: number
  interestsDisplayName: string
  onLayout: (index: number, x: number, width: number) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const label = active
    ? _(
        msg({
          message: `"${interestsDisplayName}" category (active)`,
          comment:
            'Accessibility label for a category (e.g. Art, Video Games, Sports, etc.) that shows suggested accounts for the user to follow. The tab is currently selected.',
        }),
      )
    : _(
        msg({
          message: `Select "${interestsDisplayName}" category`,
          comment:
            'Accessibility label for a category (e.g. Art, Video Games, Sports, etc.) that shows suggested accounts for the user to follow. The tab is not currently active and can be selected.',
        }),
      )

  return (
    <View
      key={interest}
      onLayout={e =>
        onLayout(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width)
      }>
      <Button
        label={label}
        onPress={() => onSelectTab(index)}
        // disable focus ring, we handle it
        style={web({outline: 'none'})}>
        {({hovered, pressed, focused}) => (
          <View
            style={[
              a.rounded_full,
              a.px_lg,
              a.py_sm,
              a.border,
              active || hovered || pressed
                ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_medium]
                : focused
                  ? {
                      borderColor: t.palette.primary_300,
                      backgroundColor: t.palette.primary_25,
                    }
                  : [t.atoms.bg, t.atoms.border_contrast_low],
            ]}>
            <Text
              style={[
                a.font_medium,
                active || hovered || pressed
                  ? t.atoms.text
                  : t.atoms.text_contrast_medium,
              ]}>
              {interestsDisplayName}
            </Text>
          </View>
        )}
      </Button>
    </View>
  )
}

export function boostInterests(boosts?: string[]) {
  return (_a: string, _b: string) => {
    const indexA = boosts?.indexOf(_a) ?? -1
    const indexB = boosts?.indexOf(_b) ?? -1
    const rankA = indexA === -1 ? Infinity : indexA
    const rankB = indexB === -1 ? Infinity : indexB
    return rankA - rankB
  }
}
