import {createNativeBottomTabNavigator} from '@bottom-tabs/react-navigation'

import {type BottomTabNavigatorParams} from './lib/routes/types'

export const Tab = createNativeBottomTabNavigator<BottomTabNavigatorParams>()
