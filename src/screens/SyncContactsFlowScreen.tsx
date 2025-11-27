import {useCallback} from 'react'
import {BackHandler} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {useSyncContactsFlowState} from '#/components/contacts/state'
import {SyncContactsFlow} from '#/components/contacts/SyncContactsFlow'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<AllNavigatorParams, 'SyncContactsFlow'>
export function SyncContactsFlowScreen({navigation}: Props) {
  const {_} = useLingui()

  const [state, dispatch] = useSyncContactsFlowState()

  const overrideGoBack = state.step === '2: verify number'

  useFocusEffect(
    useCallback(() => {
      if (overrideGoBack) {
        navigation.setOptions({
          gestureEnabled: false,
        })

        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
          dispatch({type: 'BACK'})
          return true
        })
        return () => {
          navigation.setOptions({
            gestureEnabled: true,
          })
          sub.remove()
        }
      }
    }, [overrideGoBack, dispatch, navigation]),
  )

  return (
    <Layout.Screen>
      {isNative ? (
        <SyncContactsFlow state={state} dispatch={dispatch} />
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
