import React from 'react'

import { Onboarding2Layout } from '#/screens/Onboarding2/Layout'
import { Context, initialState, reducer } from '#/screens/Onboarding2/state'
import { StepFinished } from '#/screens/Onboarding2/StepFinished'
import { StepInterests } from '#/screens/Onboarding2/StepInterests'
import { StepProfile } from '#/screens/Onboarding2/StepProfile'
import { Portal } from '#/components/Portal'

export function Onboarding2({
  onGoBack,
  onCancel,
  handle,
}: {
  onGoBack?: () => void
  onCancel?: () => void
  handle?: string
}) {
  const [state, dispatch] = React.useReducer(reducer, {
    ...initialState,
  })

  return (
    <Portal>
      <Context.Provider
        value={React.useMemo(() => ({ state, dispatch }), [state, dispatch])}>
        <Onboarding2Layout
          onGoBack={onGoBack}
          onCancel={onCancel}
          handle={handle}>
          {state.activeStep === 'profile' && (
            <StepProfile onGoBack={onGoBack} handle={handle} />
          )}
          {state.activeStep === 'interests' && <StepInterests />}
          {state.activeStep === 'finished' && <StepFinished />}
        </Onboarding2Layout>
      </Context.Provider>
    </Portal>
  )
}
