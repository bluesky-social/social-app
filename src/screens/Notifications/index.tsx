import {useCallback, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  interpolate,
  Reanimated3DefaultSpringConfig,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {
  type NativeStackScreenProps,
  type NotificationsTabNavigatorParams,
} from '#/lib/routes/types'
import {useShellLayout} from '#/state/shell/shell-layout'
import {
  HomeHeaderModeProvider,
  useHomeHeaderMode,
} from '#/view/com/util/MainScrollProvider'
import {NotificationsScreen as LegacyNotificationsScreen} from '#/view/screens/Notifications'
import {PageList} from '#/screens/Notifications/components/PageList'
import * as Pager from '#/screens/Notifications/components/PagerView'
import {TabPills} from '#/screens/Notifications/components/TabPills'
import {atoms as a, useBreakpoints, useTheme, utils} from '#/alf'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>

export function NotificationsScreen(props: Props) {
  const ax = useAnalytics()
  const isNewNotificationsEnabled = ax.features.enabled(
    ax.features.NotificationsV2Enable,
  )

  if (isNewNotificationsEnabled) {
    return <NewNotificationsScreen {...props} />
  }

  return <LegacyNotificationsScreen {...props} />
}

export function NewNotificationsScreen({}: Props) {
  return (
    <Layout.Screen testID="newNotificationsScreen" noInsetTop={IS_LIQUID_GLASS}>
      <HomeHeaderModeProvider>
        <NewNotificationsScreenInner />
      </HomeHeaderModeProvider>
    </Layout.Screen>
  )
}

function NewNotificationsScreenInner() {
  const {t: l} = useLingui()
  const headerMode = useHomeHeaderMode()
  const initialHeaderOffset = useHeaderOffset()
  const [headerOffset, setHeaderOffset] = useState(initialHeaderOffset)
  const tabs = [
    {key: 'all', label: l`All`},
    {key: 'people-i-follow', label: l`People I follow`},
    {key: 'follows', label: l`Follows`},
    {key: 'replies', label: l`Replies`},
    {key: 'activity', label: l`Activity`},
    {key: 'atmosphere', label: l`Atmosphere`},
  ]

  const showHeader = useCallback(() => {
    'worklet'
    headerMode.set(
      withSpring(0, {
        ...Reanimated3DefaultSpringConfig,
        overshootClamping: true,
      }),
    )
  }, [headerMode])

  useFocusEffect(
    useCallback(() => {
      return () => showHeader()
    }, [showHeader]),
  )

  return (
    <Pager.Root
      onTabPressed={showHeader}
      onPageScrollStateChanged={state => {
        'worklet'
        if (state === 'dragging') {
          showHeader()
        }
      }}>
      <NotificationsHeader onHeightChange={setHeaderOffset}>
        <Pager.TabBar>
          {({selectedPage, selectPage, dragProgress}) => (
            <TabPills
              tabs={tabs}
              selectedTab={tabs[selectedPage].key}
              dragProgress={dragProgress}
              onSelectTab={tab =>
                selectPage(tabs.findIndex(candidate => candidate.key === tab))
              }
              contentContainerStyle={a.pb_xs}
            />
          )}
        </Pager.TabBar>
      </NotificationsHeader>
      <Pager.Content manageDrawerGesture testID="notificationsPagerView">
        {tabs.map((tab, pageIndex) => (
          <PageList
            key={tab.key}
            pageIndex={pageIndex}
            headerOffset={headerOffset}
          />
        ))}
      </Pager.Content>
    </Pager.Root>
  )
}

function NotificationsHeader({
  children,
  onHeightChange,
}: {
  children: React.ReactNode
  onHeightChange: (height: number) => void
}) {
  const t = useTheme()
  const headerMode = useHomeHeaderMode()
  const {headerHeight} = useShellLayout()
  const {gtMobile} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const headerPinnedHeight = IS_LIQUID_GLASS ? insets.top : 0

  const titleStyle = useAnimatedStyle(() => {
    const mode = headerMode.get()
    return {
      opacity: Math.pow(1 - mode, 2),
      pointerEvents: mode === 0 ? 'auto' : 'none',
    }
  })

  const pillsStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            headerMode.get(),
            [0, 1],
            [0, headerPinnedHeight - headerHeight.get()],
          ),
        },
      ],
    }
  })

  return (
    <View
      pointerEvents="box-none"
      style={[a.fixed, a.z_10, a.top_0, a.left_0, a.right_0]}
      onLayout={event => onHeightChange(event.nativeEvent.layout.height)}>
      {IS_LIQUID_GLASS ? (
        <LinearGradient
          key={t.name}
          pointerEvents="none"
          style={[a.absolute, a.inset_0]}
          start={[0.5, 0]}
          end={[0.5, 1]}
          colors={[
            t.atoms.bg.backgroundColor,
            utils.alpha(t.atoms.bg.backgroundColor, 0.8),
            utils.alpha(t.atoms.bg.backgroundColor, 0),
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[a.absolute, a.inset_0, t.atoms.bg]}
        />
      )}
      {IS_WEB && gtMobile && (
        <Layout.Center
          pointerEvents="none"
          style={[
            a.absolute,
            a.inset_0,
            a.border_x,
            t.atoms.border_contrast_low,
            {maxWidth: Layout.CENTER_COLUMN_WIDTH + 2},
          ]}
        />
      )}
      <Animated.View
        style={[IS_LIQUID_GLASS && {paddingTop: insets.top}, titleStyle]}
        onLayout={event => {
          headerHeight.set(event.nativeEvent.layout.height)
        }}>
        <Layout.Header.Outer noBottomBorder sticky={false}>
          <Layout.Header.MenuButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Notifications</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
      </Animated.View>
      <Animated.View style={pillsStyle}>
        <Layout.Center>{children}</Layout.Center>
      </Animated.View>
    </View>
  )
}
