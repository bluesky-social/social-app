import {BottomSheetOutlet} from '@bsky.app/bottom-sheet'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler'
import {useNotificationsRegistration} from '#/lib/notifications/notifications'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {LoggedOut} from '#/view/com/auth/LoggedOut'
import {ModerationInboxScreen} from '#/screens/ModerationInbox'
import {ModerationInboxNoticeDetailsScreen} from '#/screens/ModerationInbox/Notice'
import {ModerationInboxReportDetailsScreen} from '#/screens/ModerationInbox/Report'
import {ModerationInboxSettingsScreen} from '#/screens/ModerationInbox/Settings'
import {Takendown} from '#/screens/Takendown'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {IS_NATIVE} from '#/env'
import {RoutesContainer} from '#/Navigation'

type RestrictedParams = Pick<
  CommonNavigatorParams,
  | 'ModerationInbox'
  | 'ModerationInboxNoticeDetails'
  | 'ModerationInboxReportDetails'
  | 'ModerationInboxSettings'
> & {Takendown: undefined}

const Stack = createNativeStackNavigator<RestrictedParams>()

function TakendownPushHandlers() {
  useNotificationsRegistration()
  useNotificationsHandler()
  return null
}

function TakendownHome() {
  return (
    <>
      {IS_NATIVE && <TakendownPushHandlers />}
      <Takendown />
    </>
  )
}

export function TakendownNavigator() {
  const {showLoggedOut} = useLoggedOutView()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  if (showLoggedOut) {
    return <LoggedOut onDismiss={() => setShowLoggedOut(false)} />
  }
  return (
    <RoutesContainer restricted>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Takendown" component={TakendownHome} />
        <Stack.Screen
          name="ModerationInbox"
          component={ModerationInboxScreen}
        />
        <Stack.Screen
          name="ModerationInboxNoticeDetails"
          component={ModerationInboxNoticeDetailsScreen}
        />
        <Stack.Screen
          name="ModerationInboxReportDetails"
          component={ModerationInboxReportDetailsScreen}
        />
        <Stack.Screen
          name="ModerationInboxSettings"
          component={ModerationInboxSettingsScreen}
        />
      </Stack.Navigator>
      <PortalOutlet />
      <BottomSheetOutlet />
    </RoutesContainer>
  )
}
