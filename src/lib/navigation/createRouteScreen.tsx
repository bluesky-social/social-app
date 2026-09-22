import {useNavigation, useRoute} from '#/lib/navigation'
import {type NavigationProp} from '#/lib/routes/types'
import {renderMessagesSplitViewLayout} from '#/screens/Messages/components/splitView/MessagesSplitViewLayout'

/** Adapt existing screen props at the file-route boundary during the migration. */
export function createRouteScreen<P>(
  name: string,
  Component: React.ComponentType<P>,
  initialParams?: object,
) {
  return function RouteScreen() {
    const navigation = useNavigation<NavigationProp>()
    const currentRoute = useRoute()
    const route = {
      ...currentRoute,
      name,
      params: {...initialParams, ...currentRoute.params},
    }
    const screen = (
      <Component
        {...({navigation, route} as unknown as P &
          React.JSX.IntrinsicAttributes)}
      />
    )
    if (name.startsWith('Messages')) {
      return renderMessagesSplitViewLayout({
        children: screen,
        navigation,
        route,
      } as Parameters<typeof renderMessagesSplitViewLayout>[0])
    }
    return screen
  }
}
