import React from 'react'
import {render} from '@testing-library/react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {RootSiblingParent} from 'react-native-root-siblings'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootStoreProvider} from '../src/state'
import {mockedRootStore} from '../__mocks__/state-mock'

const customRender = (ui: any, storeMock?: any) =>
  render(
    // eslint-disable-next-line react-native/no-inline-styles
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider
          value={
            storeMock != null
              ? {...mockedRootStore, ...storeMock}
              : mockedRootStore
          }>
          <SafeAreaProvider>{ui}</SafeAreaProvider>
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>,
  )

// re-export everything
export * from '@testing-library/react-native'

// override render method
export {customRender as render}
