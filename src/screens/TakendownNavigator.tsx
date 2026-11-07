import {createNativeStackNavigator} from '@react-navigation/native-stack'

import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler'
import {useNotificationsRegistration} from '#/lib/notifications/notifications'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {ModerationInboxScreen} from '#/screens/ModerationInbox'
import {ModerationInboxNoticeDetailsScreen} from '#/screens/ModerationInbox/Notice'
import {ModerationInboxReportDetailsScreen} from '#/screens/ModerationInbox/Report'
import {ModerationInboxSettingsScreen} from '#/screens/ModerationInbox/Settings'
import {Takendown} from '#/screens/Takendown'
import {RoutesContainer} from '#/Navigation'

type RestrictedParams = Pick<
  CommonNavigatorParams,
  | 'ModerationInbox'
  | 'ModerationInboxNoticeDetails'
  | 'ModerationInboxReportDetails'
  | 'ModerationInboxSettings'
> & {Takendown: undefined}

const Stack = createNativeStackNavigator<RestrictedParams>()

function TakendownHome() {
  useNotificationsRegistration()
  useNotificationsHandler()
  return <Takendown />
}

export function TakendownNavigator() {
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
    </RoutesContainer>
  )
}
