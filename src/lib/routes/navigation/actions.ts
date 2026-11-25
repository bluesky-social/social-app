import {type NavigationState} from '@react-navigation/native'

import {type MessagesTabNavigatorParams} from '#/lib/routes/types'

export type NavigationMode = 'navigate' | 'replace'
export type NavigatorState = Pick<NavigationState, 'routeNames'>
export type MessagesParams = MessagesTabNavigatorParams['Messages']
