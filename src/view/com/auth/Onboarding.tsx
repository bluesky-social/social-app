import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import React from 'react'
import {Platform, SafeAreaView} from 'react-native'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'

import {useOnboardingDispatch, useOnboardingState} from '#/state/shell'
import {useSetMinimalShellMode} from '#/state/shell/minimal-mode'

import {RecommendedFeeds} from './onboarding/RecommendedFeeds'
import {RecommendedFollows} from './onboarding/RecommendedFollows'
import {Welcome} from './onboarding/Welcome'

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
    <SafeAreaView
      testID="onboardingView"
      style={[
        s.hContentRegion,
        pal.view,
        // @ts-ignore web only -esb
        Platform.select({
          web: {
            height: '100vh',
          },
        }),
      ]}>
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
