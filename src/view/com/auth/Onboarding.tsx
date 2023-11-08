import React from 'react'
import {SafeAreaView} from 'react-native'
import {observer} from 'mobx-react-lite'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {Welcome} from './onboarding/Welcome'
import {RecommendedFeeds} from './onboarding/RecommendedFeeds'
import {RecommendedFollows} from './onboarding/RecommendedFollows'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'

export const Onboarding = observer(function OnboardingImpl() {
  const pal = usePalette('default')
  const store = useStores()
  const setMinimalShellMode = useSetMinimalShellMode()

  React.useEffect(() => {
    setMinimalShellMode(true)
  }, [setMinimalShellMode])

  const next = () => store.onboarding.next()
  const skip = () => store.onboarding.skip()

  return (
    <SafeAreaView testID="onboardingView" style={[s.hContentRegion, pal.view]}>
      <ErrorBoundary>
        {store.onboarding.step === 'Welcome' && (
          <Welcome skip={skip} next={next} />
        )}
        {store.onboarding.step === 'RecommendedFeeds' && (
          <RecommendedFeeds next={next} />
        )}
        {store.onboarding.step === 'RecommendedFollows' && (
          <RecommendedFollows next={next} />
        )}
      </ErrorBoundary>
    </SafeAreaView>
  )
})
