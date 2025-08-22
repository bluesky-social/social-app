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
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

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
  const listRef = useRef<ScrollView>(null)
  const [totalWidth, setTotalWidth] = useState(0)
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
      if (pendingTabOffsets.current.length === interests.length) {
        setTabOffsets(pendingTabOffsets.current)
      }
    }
  }

  return (
    <DraggableScrollView
      ref={listRef}
      horizontal
      contentContainerStyle={[
        a.gap_sm,
        {paddingHorizontal: gutterWidth},
        contentContainerStyle,
      ]}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToOffsets={
        tabOffsets.length === interests.length
          ? tabOffsets.map(o => o.x - tokens.space.xl)
          : undefined
      }
      onLayout={evt => setTotalWidth(evt.nativeEvent.layout.width)}
      scrollEventThrottle={200} // big throttle
    >
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
    ? _(msg`Select "${interestsDisplayName}" category (active)`)
    : _(msg`Select "${interestsDisplayName}" category`)
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
