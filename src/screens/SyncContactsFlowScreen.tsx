import {useCallback, useLayoutEffect} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {usePreventRemove} from '@react-navigation/native'

import {useEnableKeyboardControllerScreen} from '#/lib/hooks/useEnableKeyboardController'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {useSetMinimalShellMode} from '#/state/shell'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {useSyncContactsFlowState} from '#/components/contacts/state'
import {SyncContactsFlow} from '#/components/contacts/SyncContactsFlow'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<AllNavigatorParams, 'SyncContactsFlow'>
export function SyncContactsFlowScreen({navigation}: Props) {
  const {_} = useLingui()

  const [state, dispatch] = useSyncContactsFlowState()

  const overrideGoBack = state.step === '2: verify number'

  usePreventRemove(overrideGoBack, () => {
    dispatch({type: 'BACK'})
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
      {isNative ? (
        <SyncContactsFlow
          state={state}
          dispatch={dispatch}
          onSkip={() => navigation.goBack()}
          context="Standalone"
        />
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
