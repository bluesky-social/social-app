import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {emitSoftReset, listenSoftReset} from '#/state/events'
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
import {colors, s} from 'lib/styles'
import {TextLink} from 'view/com/util/Link'
import {ListMethods} from 'view/com/util/List'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {CenteredView} from 'view/com/util/Views'
import {Loader} from '#/components/Loader'
import {Feed} from '../com/notifications/Feed'
import {FAB} from '../com/util/fab/FAB'
import {MainScrollProvider} from '../com/util/MainScrollProvider'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export function NotificationsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const [isLoadingLatest, setIsLoadingLatest] = React.useState(false)
  const scrollElRef = React.useRef<ListMethods>(null)
  const {screen} = useAnalytics()
  const pal = usePalette('default')
  const {isDesktop} = useWebMediaQueries()
  const queryClient = useQueryClient()
  const unreadNotifs = useUnreadNotifications()
  const unreadApi = useUnreadNotificationsApi()
  const hasNew = !!unreadNotifs
  const isScreenFocused = useIsFocused()
  const {openComposer} = useComposerControls()

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
      setIsLoadingLatest(true)
      unreadApi
        .checkUnread({invalidate: true})
        .catch(() => undefined)
        .then(() => setIsLoadingLatest(false))
    }
  }, [scrollToTop, queryClient, unreadApi, hasNew, setIsLoadingLatest])

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
          {isLoadingLatest ? <Loader size="md" /> : <></>}
        </View>
      )
    }
    return <></>
  }, [isDesktop, pal, hasNew, isLoadingLatest])

  const renderHeaderSpinner = React.useCallback(() => {
    return (
      <View style={{width: 30, height: 20, alignItems: 'flex-end'}}>
        {isLoadingLatest ? <Loader width={20} /> : <></>}
      </View>
    )
  }, [isLoadingLatest])

  return (
    <CenteredView
      testID="notificationsScreen"
      style={[s.hContentRegion, {paddingTop: 2}]}
      sideBorders={true}>
      <ViewHeader
        title={_(msg`Notifications`)}
        canGoBack={false}
        showBorder={true}
        renderButton={renderHeaderSpinner}
      />
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
      <FAB
        testID="composeFAB"
        onPress={() => openComposer({})}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New post`)}
        accessibilityHint=""
      />
    </CenteredView>
  )
}
