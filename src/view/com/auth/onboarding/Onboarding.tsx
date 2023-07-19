import React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Welcome} from './Welcome'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {HomeTabNavigatorParams} from 'lib/routes/types'
import {useStores} from 'state/index'

enum OnboardingStep {
  WELCOME = 'WELCOME',
  // CHOOSE_PREFERENCES = 'CHOOSE_PREFERENCES',
  COMPLETE = 'COMPLETE',
}
type OnboardingState = {
  currentStep: OnboardingStep
}
type Action = {type: 'NEXT_STEP'}
const initialState: OnboardingState = {
  currentStep: OnboardingStep.WELCOME,
}
const reducer = (state: OnboardingState, action: Action): OnboardingState => {
  switch (action.type) {
    case 'NEXT_STEP':
      switch (state.currentStep) {
        case OnboardingStep.WELCOME:
          return {...state, currentStep: OnboardingStep.COMPLETE}
        case OnboardingStep.COMPLETE:
          return state
        default:
          return state
      }
    default:
      return state
  }
}

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Onboarding'>
export const Onboarding = ({navigation}: Props) => {
  const pal = usePalette('default')
  const rootStore = useStores()
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const next = React.useCallback(
    () => dispatch({type: 'NEXT_STEP'}),
    [dispatch],
  )

  React.useEffect(() => {
    if (state.currentStep === OnboardingStep.COMPLETE) {
      // navigate to home
      navigation.goBack()
      rootStore.shell.setShowOnboarding(false)
    }
  })

  return (
    <View style={[styles.container, pal.view]}>
      {state.currentStep === OnboardingStep.WELCOME && <Welcome next={next} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 20,
  },
})
