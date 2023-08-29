import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useStores} from 'state/index'

import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {Welcome} from '../auth/onboarding/Welcome'
import {observer} from 'mobx-react-lite'
import {RecommendedFeeds} from '../auth/onboarding/RecommendedFeeds'

export const snapPoints = ['90%']

export const Component = observer(({}: {}) => {
  const pal = usePalette('default')
  const store = useStores()

  const next = () => {
    const nextScreenName = store.onboarding.next()
    if (nextScreenName === 'Home') {
      store.shell.closeModal()
    }
  }

  return (
    <View style={[styles.container, pal.view]} testID="onboardingModal">
      {store.onboarding.step === 'Welcome' ? <Welcome next={next} /> : null}
      {store.onboarding.step === 'RecommendedFeeds' ? (
        <RecommendedFeeds next={next} />
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 50,
    maxHeight: '750px',
  },
})
