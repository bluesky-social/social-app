import {useLingui} from '@lingui/react/macro'

import {useWebScrollRestoration} from '#/lib/hooks/useWebScrollRestoration'
import {routeConfig} from '#/lib/navigation/routeConfig'
import {type TabGroup, tabRoots} from '#/lib/navigation/routes'
import {Stack} from '#/lib/navigation/Stack'
import {bskyTitle} from '#/lib/strings/headings'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {DrawerLayout} from '#/view/shell'
import {useTheme} from '#/alf'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

export const unstable_settings = {
  initialRouteName: 'index',
  home: {initialRouteName: 'index'},
  search: {initialRouteName: 'search'},
  messages: {initialRouteName: 'messages'},
  notifications: {initialRouteName: 'notifications'},
  profile: {initialRouteName: 'my-profile'},
}

export default function AppStack({segment}: {segment: string}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const unread = useUnreadNotifications()
  const screenListeners = useWebScrollRestoration()
  const group = segment.slice(1, -1) as TabGroup

  return (
    <Stack
      initialRouteName={tabRoots[group] ?? 'index'}
      screenOptions={{
        fullScreenGestureEnabled: true,
        headerShown: false,
        contentStyle: t.atoms.bg,
      }}
      screenListeners={screenListeners}
      layout={
        IS_WEB
          ? ({children}) => <DrawerLayout>{children}</DrawerLayout>
          : undefined
      }>
      {Object.entries(routeConfig).map(([file, config]) => (
        <Stack.Screen
          key={file}
          name={file}
          options={({route}) => {
            const params = route.params as Record<string, string> | undefined
            return {
              requireAuth: config.requireAuth,
              ...('gestureEnabled' in config
                ? {gestureEnabled: config.gestureEnabled}
                : {}),
              title: bskyTitle(
                config.name === 'Profile'
                  ? `@${params?.name}`
                  : i18n._(config.title(String(params?.name ?? ''))),
                unread,
              ),
              ...(config.name === 'Messages'
                ? {
                    animationTypeForReplace:
                      params?.animation === 'pop' ? 'pop' : 'push',
                  }
                : {}),
              ...(IS_LIQUID_GLASS &&
              (config.name === 'Home' || config.name === 'Start')
                ? {
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: '',
                    headerBackVisible: false,
                    scrollEdgeEffects: {top: 'soft'},
                  }
                : {}),
            }
          }}
        />
      ))}
    </Stack>
  )
}
