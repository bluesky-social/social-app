import React from 'react'
import {SafeAreaView} from 'react-native'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {Welcome} from './onboarding/Welcome'
import {RecommendedFeeds} from './onboarding/RecommendedFeeds'
import {RecommendedFollows} from './onboarding/RecommendedFollows'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'
import {useOnboardingState, useOnboardingDispatch} from '#/state/shell'

export function Onboarding() {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const onboardingState = useOnboardingState()
  const onboardingDispatch = useOnboardingDispatch()

  React.useEffect(() => {
    setMinimalShellMode(true)
  }, [setMinimalShellMode])

  const next = () => onboardingDispatch({type: 'next'})
  const skip = () => onboardingDispatch({type: 'skip'})

  return (
    <SafeAreaView testID="onboardingView" style={[s.hContentRegion, pal.view]}>
      <ErrorBoundary>
        {onboardingState.step === 'Welcome' && (
          <Welcome skip={skip} next={next} />
        )}
        {onboardingState.step === 'RecommendedFeeds' && (
          <RecommendedFeeds next={next} />
        )}
        {onboardingState.step === 'RecommendedFollows' && (
          <RecommendedFollows next={next} />
        )}
      </ErrorBoundary>
    </SafeAreaView>
  )
}
