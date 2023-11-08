import React from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {
  NativeStackScreenProps,
  NotificationsTabNavigatorParams,
} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {TextLink} from 'view/com/util/Link'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {useStores} from 'state/index'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useTabFocusEffect} from 'lib/hooks/useTabFocusEffect'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s, colors} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {isWeb} from 'platform/detection'
import {logger} from '#/logger'
import {useSetMinimalShellMode} from '#/state/shell'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export const NotificationsScreen = withAuthRequired(
  observer(function NotificationsScreenImpl({}: Props) {
    const store = useStores()
    const setMinimalShellMode = useSetMinimalShellMode()
    const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll()
    const scrollElRef = React.useRef<FlatList>(null)
    const {screen} = useAnalytics()
    const pal = usePalette('default')
    const {isDesktop} = useWebMediaQueries()

    const hasNew =
      store.me.notifications.hasNewLatest &&
      !store.me.notifications.isRefreshing

    // event handlers
    // =
    const onPressTryAgain = React.useCallback(() => {
      store.me.notifications.refresh()
    }, [store])

    const scrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: 0})
      resetMainScroll()
    }, [scrollElRef, resetMainScroll])

    const onPressLoadLatest = React.useCallback(() => {
      scrollToTop()
      store.me.notifications.refresh()
    }, [store, scrollToTop])

    // on-visible setup
    // =
    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
        logger.debug('NotificationsScreen: Updating feed')
        const softResetSub = store.onScreenSoftReset(onPressLoadLatest)
        store.me.notifications.update()
        screen('Notifications')

        return () => {
          softResetSub.remove()
          store.me.notifications.markAllRead()
        }
      }, [store, screen, onPressLoadLatest, setMinimalShellMode]),
    )

    useTabFocusEffect(
      'Notifications',
      React.useCallback(
        isInside => {
          // on mobile:
          // fires with `isInside=true` when the user navigates to the root tab
          // but not when the user goes back to the screen by pressing back
          // on web:
          // essentially equivalent to useFocusEffect because we dont used tabbed
          // navigation
          if (isInside) {
            if (isWeb) {
              store.me.notifications.syncQueue()
            } else {
              if (store.me.notifications.unreadCount > 0) {
                store.me.notifications.refresh()
              } else {
                store.me.notifications.syncQueue()
              }
            }
          }
        },
        [store],
      ),
    )

    const ListHeaderComponent = React.useCallback(() => {
      if (isDesktop) {
        return (
          <View
            style={[
              pal.view,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingVertical: 12,
              },
            ]}>
            <TextLink
              type="title-lg"
              href="/notifications"
              style={[pal.text, {fontWeight: 'bold'}]}
              text={
                <>
                  Notifications{' '}
                  {hasNew && (
                    <View
                      style={{
                        top: -8,
                        backgroundColor: colors.blue3,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                      }}
                    />
                  )}
                </>
              }
              onPress={() => store.emitScreenSoftReset()}
            />
          </View>
        )
      }
      return <></>
    }, [isDesktop, pal, store, hasNew])

    return (
      <View testID="notificationsScreen" style={s.hContentRegion}>
        <ViewHeader title="Notifications" canGoBack={false} />
        <Feed
          view={store.me.notifications}
          onPressTryAgain={onPressTryAgain}
          onScroll={onMainScroll}
          scrollElRef={scrollElRef}
          ListHeaderComponent={ListHeaderComponent}
        />
        {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onPressLoadLatest}
            label="Load new notifications"
            showIndicator={hasNew}
          />
        )}
      </View>
    )
  }),
)
