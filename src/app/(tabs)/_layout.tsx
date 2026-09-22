import {Tabs} from 'expo-router'

import {DrawerLayout} from '#/view/shell'
import {BottomBar} from '#/view/shell/bottom-bar/BottomBar'

export const unstable_settings = {initialRouteName: '(home)'}

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{headerShown: false, lazy: true}}
      tabBar={props => <BottomBar {...props} />}
      layout={({children}) => <DrawerLayout>{children}</DrawerLayout>}>
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(search)" />
      <Tabs.Screen name="(messages)" />
      <Tabs.Screen name="(notifications)" />
      <Tabs.Screen name="(profile)" />
    </Tabs>
  )
}
