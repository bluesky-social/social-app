import React from 'react'
import {SafeAreaView} from 'react-native'
import {observer} from 'mobx-react-lite'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics/analytics'
import {CenteredView} from '../util/Views'
import {Welcome} from './onboarding/Welcome'
import {RecommendedFeeds} from './onboarding/RecommendedFeeds'

export const Onboarding = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const {screen} = useAnalytics()

  React.useEffect(() => {
    screen('Onboarding')
    store.shell.setMinimalShellMode(true)
  }, [store, screen])

  const next = () => store.onboarding.next()
  const skip = () => store.onboarding.skip()

  return (
    <CenteredView style={[s.hContentRegion, pal.view]}>
      <SafeAreaView testID="noSessionView" style={s.hContentRegion}>
        <ErrorBoundary>
          {store.onboarding.step === 'Welcome' && (
            <Welcome skip={skip} next={next} />
          )}
          {store.onboarding.step === 'RecommendedFeeds' && (
            <RecommendedFeeds next={next} />
          )}
        </ErrorBoundary>
      </SafeAreaView>
    </CenteredView>
  )
})
