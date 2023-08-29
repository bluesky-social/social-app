import React from 'react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {HomeTabNavigatorParams} from 'lib/routes/types'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {RecommendedFeeds} from 'view/com/auth/onboarding/RecommendedFeeds'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'RecommendedFeeds'>
export const RecommendedFeedsScreen = observer(({navigation}: Props) => {
  const store = useStores()

  const next = () => {
    const nextScreenName = store.onboarding.next('RecommendedFeeds')
    if (nextScreenName) {
      navigation.navigate(nextScreenName)
    }
  }

  return <RecommendedFeeds next={next} />
})
