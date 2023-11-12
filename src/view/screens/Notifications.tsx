import React from 'react'
import {FlatList, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
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
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s, colors} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {logger} from '#/logger'
import {useSetMinimalShellMode} from '#/state/shell'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export const NotificationsScreen = withAuthRequired(
  function NotificationsScreenImpl({}: Props) {
    const store = useStores()
    const setMinimalShellMode = useSetMinimalShellMode()
    const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll()
    const scrollElRef = React.useRef<FlatList>(null)
    const {screen} = useAnalytics()
    const pal = usePalette('default')
    const {isDesktop} = useWebMediaQueries()

    const hasNew = false // TODO

    // event handlers
    // =
    const scrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: 0})
      resetMainScroll()
    }, [scrollElRef, resetMainScroll])

    const onPressLoadLatest = React.useCallback(() => {
      scrollToTop()
      // store.me.notifications.refresh() TODO
    }, [scrollToTop])

    // on-visible setup
    // =
    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
        logger.debug('NotificationsScreen: Updating feed')
        const softResetSub = store.onScreenSoftReset(onPressLoadLatest)
        screen('Notifications')

        return () => {
          softResetSub.remove()
          // store.me.notifications.markAllRead() TODO
        }
      }, [store, screen, onPressLoadLatest, setMinimalShellMode]),
    )

    /* TODO
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
    )*/

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
  },
)
