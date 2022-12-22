import React from 'react'
import {render} from '@testing-library/react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {RootSiblingParent} from 'react-native-root-siblings'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootStoreModel, RootStoreProvider} from '../src/state'
import {mockedRootStore} from './state-mock'

const WrappedComponent = ({children}: any) => {
  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider value={mockedRootStore as RootStoreModel}>
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
