import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from '#/lib/icons'
import {
  NativeStackScreenProps,
  NotificationsTabNavigatorParams,
} from '#/lib/routes/types'
import {s} from '#/lib/styles'
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
import {Feed} from '#/view/com/notifications/Feed'
import {FAB} from '#/view/com/util/fab/FAB'
import {ListMethods} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<
  NotificationsTabNavigatorParams,
  'Notifications'
>
export function NotificationsScreen({route: {params}}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const [isLoadingLatest, setIsLoadingLatest] = React.useState(false)
  const scrollElRef = React.useRef<ListMethods>(null)
  const t = useTheme()
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
      onFocusCheckLatest()
    }, [setMinimalShellMode, onFocusCheckLatest]),
  )
  React.useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(onPressLoadLatest)
  }, [onPressLoadLatest, isScreenFocused])

  const renderButton = useCallback(() => {
    return (
      <Link
        to="/notifications/settings"
        label={_(msg`Notification settings`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="square"
        style={[a.justify_center]}>
        <SettingsIcon size="md" style={t.atoms.text_contrast_medium} />
      </Link>
    )
  }, [_, t])

  const ListHeaderComponent = React.useCallback(() => {
    if (isDesktop) {
      return (
        <View
          style={[
            t.atoms.bg,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_lg,
            a.px_lg,
            a.pr_md,
            a.py_sm,
          ]}>
          <Button
            label={_(msg`Notifications`)}
            accessibilityHint={_(msg`Refresh notifications`)}
            onPress={emitSoftReset}>
            {({hovered, pressed}) => (
              <Text
                style={[
                  a.text_2xl,
                  a.font_bold,
                  (hovered || pressed) && a.underline,
                ]}>
                <Trans>Notifications</Trans>
                {hasNew && (
                  <View
                    style={{
                      left: 4,
                      top: -8,
                      backgroundColor: t.palette.primary_500,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                )}
              </Text>
            )}
          </Button>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            {isLoadingLatest ? <Loader size="md" /> : <></>}
            {renderButton()}
          </View>
        </View>
      )
    }
    return <></>
  }, [isDesktop, t, hasNew, renderButton, _, isLoadingLatest])

  const renderHeaderSpinner = React.useCallback(() => {
    return (
      <View
        style={[
          {width: 30, height: 20},
          a.flex_row,
          a.align_center,
          a.justify_end,
          a.gap_md,
        ]}>
        {isLoadingLatest ? <Loader width={20} /> : <></>}
        {renderButton()}
      </View>
    )
  }, [renderButton, isLoadingLatest])

  return (
    <Layout.Screen testID="notificationsScreen">
      <CenteredView style={[a.flex_1, {paddingTop: 2}]} sideBorders={true}>
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
            overridePriorityNotifications={params?.show === 'all'}
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
    </Layout.Screen>
  )
}
