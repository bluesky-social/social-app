import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {
  NativeStackScreenProps,
  NotificationsTabNavigatorParams,
} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
import {TextLink} from 'view/com/util/Link'
import {ListMethods} from 'view/com/util/List'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '../com/util/MainScrollProvider'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s, colors} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {logger} from '#/logger'
import {useSetMinimalShellMode} from '#/state/shell'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  useUnreadNotifications,
  useUnreadNotificationsApi,
} from '#/state/queries/notifications/unread'
import {RQKEY as NOTIFS_RQKEY} from '#/state/queries/notifications/feed'
import {listenSoftReset, emitSoftReset} from '#/state/events'
import {truncateAndInvalidate} from '#/state/queries/util'
import {isNative} from '#/platform/detection'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export function NotificationsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const scrollElRef = React.useRef<ListMethods>(null)
  const checkLatestRef = React.useRef<() => void | null>()
  const {screen} = useAnalytics()
  const pal = usePalette('default')
  const {isDesktop} = useWebMediaQueries()
  const queryClient = useQueryClient()
  const unreadNotifs = useUnreadNotifications()
  const unreadApi = useUnreadNotificationsApi()
  const hasNew = !!unreadNotifs

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

  const onFocusCheckLatest = React.useCallback(() => {
    // on focus, check for latest, but only invalidate if the user
    // isnt scrolled down to avoid moving content underneath them
    unreadApi.checkUnread({invalidate: !isScrolledDown})
  }, [unreadApi, isScrolledDown])
  checkLatestRef.current = onFocusCheckLatest

  // on-visible setup
  // =
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      logger.debug('NotificationsScreen: Focus')
      screen('Notifications')
      checkLatestRef.current?.()
    }, [screen, setMinimalShellMode]),
  )
  React.useEffect(() => {
    return listenSoftReset(onPressLoadLatest)
  }, [onPressLoadLatest])

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
                <Trans>Notifications</Trans>{' '}
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
            onPress={emitSoftReset}
          />
        </View>
      )
    }
    return <></>
  }, [isDesktop, pal, hasNew])

  return (
    <View testID="notificationsScreen" style={s.hContentRegion}>
      <ViewHeader title={_(msg`Notifications`)} canGoBack={false} />
      <MainScrollProvider>
        <Feed
          onScrolledDownChange={setIsScrolledDown}
          scrollElRef={scrollElRef}
          ListHeaderComponent={ListHeaderComponent}
        />
      </MainScrollProvider>
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new notifications`)}
          showIndicator={hasNew}
        />
      )}
    </View>
  )
}
