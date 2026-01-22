import {useCallback, useState} from 'react'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {SafeAreaView} from 'react-native-safe-area-context'

import {useCallOnce} from '#/lib/once'
import {FindContactsFlow} from '#/components/contacts/FindContactsFlow'
import {type Action, type State} from '#/components/contacts/state'
import {ScreenTransition} from '#/components/ScreenTransition'
import {useAnalytics} from '#/analytics'
import {useOnboardingInternalState} from '../state'

export function StepFindContacts({
  flowState,
  flowDispatch,
}: {
  flowState: State
  flowDispatch: React.ActionDispatch<[Action]>
}) {
  const {dispatch} = useOnboardingInternalState()
  const ax = useAnalytics()

  useCallOnce(() => {
    ax.metric('onboarding:contacts:begin', {})
  })()

  const [transitionDirection, setTransitionDirection] = useState<
    'Forward' | 'Backward'
  >('Forward')

  const isFinalStep = flowState.step === '4: view matches'
  const onSkip = useCallback(() => {
    if (!isFinalStep) {
      ax.metric('onboarding:contacts:skipPressed', {})
    }
    dispatch({type: 'next'})
  }, [dispatch, isFinalStep, ax])

  const canGoBack = flowState.step === '2: verify number'
  const onBack = useCallback(() => {
    if (canGoBack) {
      setTransitionDirection('Backward')
      flowDispatch({type: 'BACK'})
      setTimeout(() => {
        setTransitionDirection('Forward')
      })
    } else {
      dispatch({type: 'prev'})
    }
  }, [dispatch, flowDispatch, canGoBack])

  return (
    <SafeAreaView edges={['left', 'top', 'right']}>
      <LayoutAnimationConfig skipEntering skipExiting>
        <ScreenTransition key={flowState.step} direction={transitionDirection}>
          <FindContactsFlow
            context="Onboarding"
            state={flowState}
            dispatch={flowDispatch}
            onCancel={onSkip}
            onBack={onBack}
          />
        </ScreenTransition>
      </LayoutAnimationConfig>
    </SafeAreaView>
  )
}
