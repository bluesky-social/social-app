import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {RQKEY as NOTIFS_RQKEY} from '#/state/queries/notifications/feed'
import {
  useUnreadNotifications,
  useUnreadNotificationsApi,
} from '#/state/queries/notifications/unread'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from 'lib/icons'
import {
  NativeStackScreenProps,
  NotificationsTabNavigatorParams,
} from 'lib/routes/types'
import {s} from 'lib/styles'
import {ListMethods} from 'view/com/util/List'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {Text} from 'view/com/util/text/Text'
import {Feed} from '../com/notifications/Feed'
import {PagerRef} from '../com/pager/Pager'
import {PagerWithHeader} from '../com/pager/PagerWithHeader'
import {FAB} from '../com/util/fab/FAB'
import {MainScrollProvider} from '../com/util/MainScrollProvider'
import {SimpleViewHeader} from '../com/util/SimpleViewHeader'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export function NotificationsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const [filterType, setFilterType] = React.useState('All')
  const scrollElRef = React.useRef<ListMethods>(null)
  const {screen} = useAnalytics()
  const pal = usePalette('default')
  const queryClient = useQueryClient()
  const unreadNotifs = useUnreadNotifications()
  const unreadApi = useUnreadNotificationsApi()
  const hasNew = !!unreadNotifs
  const isScreenFocused = useIsFocused()
  const {openComposer} = useComposerControls()
  const pagerRef = React.useRef<PagerRef>(null)
  const {isMobile} = useWebMediaQueries()

  const handleTabChange = React.useCallback(
    (index: number) => {
      const types = ['All', 'Mentions']
      if (filterType !== types[index]) {
        setFilterType(types[index])
      }
    },
    [filterType],
  )

  const renderHeader = () => {
    return (
      <SimpleViewHeader
        showBackButton={isMobile}
        style={[pal.border, {borderBottomWidth: 1}]}>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: 'bold'}]}>
            <Trans>Notifications</Trans>
          </Text>
        </View>
      </SimpleViewHeader>
    )
  }

  const sectionTitles = [_('All'), _('Mentions')]

  // event handlers
  // =
  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({animated: isNative, offset: 0})
    setMinimalShellMode(false)
  }, [scrollElRef, setMinimalShellMode])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    if (hasNew) {
      // render what we have now
      truncateAndInvalidate(queryClient, NOTIFS_RQKEY())
    } else {
      // check with the server
      unreadApi.checkUnread({invalidate: true})
    }
  }, [scrollToTop, queryClient, unreadApi, hasNew])

  const onFocusCheckLatest = useNonReactiveCallback(() => {
    // on focus, check for latest, but only invalidate if the user
    // isnt scrolled down to avoid moving content underneath them
    let currentIsScrolledDown
    if (isNative) {
      currentIsScrolledDown = isScrolledDown
    } else {
      // On the web, this isn't always updated in time so
      // we're just going to look it up synchronously.
      currentIsScrolledDown = window.scrollY > 200
    }
    unreadApi.checkUnread({invalidate: !currentIsScrolledDown})
  })

  // on-visible setup
  // =
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      logger.debug('NotificationsScreen: Focus')
      screen('Notifications')
      onFocusCheckLatest()
    }, [screen, setMinimalShellMode, onFocusCheckLatest]),
  )
  React.useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(onPressLoadLatest)
  }, [onPressLoadLatest, isScreenFocused])

  return (
    <View testID="notificationsScreen" style={s.hContentRegion}>
      <PagerWithHeader
        onPageSelected={handleTabChange}
        ref={pagerRef}
        initialPage={0}
        renderHeader={renderHeader}
        items={sectionTitles}
        isHeaderReady={true}>
        {({scrollElRef}) => (
          <MainScrollProvider>
            <Feed
              filterType="All"
              onScrolledDownChange={setIsScrolledDown}
              scrollElRef={scrollElRef}
            />
          </MainScrollProvider>
        )}
        {({scrollElRef}) => (
          <MainScrollProvider>
            <Feed
              filterType="Mentions"
              onScrolledDownChange={setIsScrolledDown}
              scrollElRef={scrollElRef}
            />
          </MainScrollProvider>
        )}
      </PagerWithHeader>
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new notifications`)}
          showIndicator={hasNew}
        />
      )}
      <FAB
        testID="composeFAB"
        onPress={() => openComposer({})}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New post`)}
        accessibilityHint=""
      />
    </View>
  )
}
