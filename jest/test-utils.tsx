import React from 'react'
import {render} from '@testing-library/react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {RootSiblingParent} from 'react-native-root-siblings'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {RootStoreProvider, RootStoreModel} from '../src/state'
import {ThemeProvider} from '../src/lib/ThemeContext'

const customRender = (ui: any, rootStore: RootStoreModel) =>
  render(
    // eslint-disable-next-line react-native/no-inline-styles
    <GestureHandlerRootView style={{flex: 1}}>
      <RootSiblingParent>
        <RootStoreProvider value={rootStore}>
          <ThemeProvider theme="light">
            <SafeAreaProvider>{ui}</SafeAreaProvider>
          </ThemeProvider>
        </RootStoreProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>,
  )

// re-export everything
export * from '@testing-library/react-native'

// override render method
export {customRender as render}
