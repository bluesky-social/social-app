import React from 'react'
import RN from 'react-native'
import {render} from '@testing-library/react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {RootSiblingParent} from 'react-native-root-siblings'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {DEFAULT_SERVICE, RootStoreModel, RootStoreProvider} from '../src/state'
import {SessionServiceClient} from '../src/third-party/api/src'
import {sessionClient as AtpApi} from '../src/third-party/api'

const WrappedComponent = ({children}: any) => {
  const api = AtpApi.service(DEFAULT_SERVICE) as SessionServiceClient
  const rootStore = new RootStoreModel(api)
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider value={rootStore}>
          <SafeAreaProvider>{children}</SafeAreaProvider>
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  )
}

const customRender = (ui: any, options?: any) =>
  render(ui, {wrapper: WrappedComponent, ...options})

// re-export everything
export * from '@testing-library/react-native'

// override render method
export {customRender as render}
