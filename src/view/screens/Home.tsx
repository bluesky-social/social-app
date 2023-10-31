import React from 'react'
import {useWindowDimensions} from 'react-native'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, HomeTabNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useDevSignedIn} from 'lib/hooks/waverly/dev/useDevSignedIn'
import {CardBrowser} from 'view/com/w2/browser/CardBrowser'
import {Text} from '../com/util/text/Text'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useStyle} from 'lib/hooks/waverly/useStyle'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

export const POLL_FREQ = 30e3 // 30sec

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Home'>
export const HomeScreen = withAuthRequired(
  observer(function HomeScreenImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()

    const {state} = useDevSignedIn()

    const feedModel = store.me.waverlyFeed

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        store.shell.setFabUseDefaultCallbacks()
        store.shell.setFabMode('waverly', 'round')
        store.shell.showFab()
      }, [store]),
    )

    const safeAreaInsets = useSafeAreaInsets()
    const marginStyle = useStyle(
      () => ({
        marginTop: safeAreaInsets.top,
        marginBottom: 116, // TODO: calculate this.
      }),
      [safeAreaInsets.top],
    )

    let message: string | undefined
    if (state === 'signingIn') message = 'Signing in...'
    else if (state === 'error') message = 'Error signing in...'
    else if (!feedModel) message = 'Internal error!'
    else if (feedModel.isLoading) message = 'Loading feed...'
    else if (feedModel.isRefreshing) message = 'Refreshing feed...'
    else if (feedModel.isEmpty) message = 'Empty feed'
    else message = feedModel.error

    if (message) {
      return (
        <View style={s.p10}>
          <Text style={pal.text}>{message}</Text>
        </View>
      )
    }

    return <CardBrowser marginStyle={marginStyle} groupFeedModel={feedModel} />
  }),
)

export function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop) {
    return 0
  }
  if (isTablet) {
    return 50
  }
  // default text takes 44px, plus 34px of pad
  // scale the 44px by the font scale
  return 34 + 44 * fontScale
}
