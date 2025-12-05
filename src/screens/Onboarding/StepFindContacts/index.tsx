import {useCallback} from 'react'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {SafeAreaView} from 'react-native-safe-area-context'

import {FindContactsFlow} from '#/components/contacts/FindContactsFlow'
import {useFindContactsFlowState} from '#/components/contacts/state'
import {ScreenTransition} from '#/components/ScreenTransition'
import {useOnboardingInternalState} from '../state'

export function StepFindContacts() {
  const [fcfState, fcfDispatch] = useFindContactsFlowState()
  const {dispatch} = useOnboardingInternalState()

  const onSkip = useCallback(() => {
    dispatch({type: 'next'})
  }, [dispatch])

  const canGoBack = fcfState.step === '2: verify number'
  const onBack = useCallback(() => {
    if (canGoBack) {
      fcfDispatch({type: 'BACK'})
    } else {
      dispatch({type: 'prev'})
    }
  }, [dispatch, fcfDispatch, canGoBack])

  return (
    <SafeAreaView edges={['left', 'top', 'right']}>
      <LayoutAnimationConfig skipEntering skipExiting>
        <ScreenTransition key={fcfState.step} direction="Forward">
          <FindContactsFlow
            context="Onboarding"
            state={fcfState}
            dispatch={fcfDispatch}
            onCancel={onSkip}
            onBack={onBack}
          />
        </ScreenTransition>
      </LayoutAnimationConfig>
    </SafeAreaView>
  )
}
