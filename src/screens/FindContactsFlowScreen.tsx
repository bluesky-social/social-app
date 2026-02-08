import {useCallback, useLayoutEffect, useState} from 'react'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {usePreventRemove} from '@react-navigation/native'

import {useEnableKeyboardControllerScreen} from '#/lib/hooks/useEnableKeyboardController'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useSetMinimalShellMode} from '#/state/shell'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {FindContactsFlow} from '#/components/contacts/FindContactsFlow'
import {useFindContactsFlowState} from '#/components/contacts/state'
import * as Layout from '#/components/Layout'
import {ScreenTransition} from '#/components/ScreenTransition'
import {IS_NATIVE} from '#/env'

type Props = NativeStackScreenProps<AllNavigatorParams, 'FindContactsFlow'>
export function FindContactsFlowScreen({navigation}: Props) {
  const {_} = useLingui()

  const [state, dispatch] = useFindContactsFlowState()

  const [transitionDirection, setTransitionDirection] = useState<
    'Forward' | 'Backward'
  >('Forward')

  const overrideGoBack = state.step === '2: verify number'

  usePreventRemove(overrideGoBack, () => {
    setTransitionDirection('Backward')
    dispatch({type: 'BACK'})
    setTimeout(() => {
      setTransitionDirection('Forward')
    })
  })

  useEnableKeyboardControllerScreen(true)

  const setMinimalShellMode = useSetMinimalShellMode()
  const effect = useCallback(() => {
    setMinimalShellMode(true)
    return () => setMinimalShellMode(false)
  }, [setMinimalShellMode])
  useLayoutEffect(effect)

  return (
    <Layout.Screen>
      {IS_NATIVE ? (
        <LayoutAnimationConfig skipEntering skipExiting>
          <ScreenTransition key={state.step} direction={transitionDirection}>
            <FindContactsFlow
              state={state}
              dispatch={dispatch}
              onCancel={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate('FindContactsFlow', undefined, {
                      pop: true,
                    })
              }
              context="Standalone"
            />
          </ScreenTransition>
        </LayoutAnimationConfig>
      ) : (
        <ErrorScreen
          title={_(msg`Not available on this platform.`)}
          message={_(msg`Please use the native app to sync your contacts.`)}
          showHeader
        />
      )}
    </Layout.Screen>
  )
}
