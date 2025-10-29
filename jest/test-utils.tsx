import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {render} from '@testing-library/react-native'

import {ThemeProvider} from '../src/lib/ThemeContext'
import {type RootStoreModel, RootStoreProvider} from '../src/state'

const customRender = (ui: any, rootStore: RootStoreModel) =>
  render(
    <GestureHandlerRootView style={{flex: 1}}>
      <RootStoreProvider value={rootStore}>
        <ThemeProvider theme="light">
          <SafeAreaProvider>{ui}</SafeAreaProvider>
        </ThemeProvider>
      </RootStoreProvider>
    </GestureHandlerRootView>,
  )

// re-export everything
export * from '@testing-library/react-native'

// override render method
export {customRender as render}
