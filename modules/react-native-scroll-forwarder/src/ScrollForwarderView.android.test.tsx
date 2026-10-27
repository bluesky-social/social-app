import {UIManager, View} from 'react-native'
import {render} from '@testing-library/react-native'

jest.mock('./ScrollForwarderViewNativeComponent', () => ({
  __esModule: true,
  default: 'NativeScrollForwarderView',
}))

afterEach(() => jest.restoreAllMocks())

it('keeps profile content usable when an OTA reaches a binary without the Android native view', () => {
  jest.spyOn(UIManager, 'hasViewManagerConfig').mockReturnValue(false)
  const {ScrollForwarderView, isScrollForwarderAvailable} =
    require('./ScrollForwarderView.android') as typeof import('./ScrollForwarderView.android')
  const result = render(
    <ScrollForwarderView testID="nativeForwarder" scrollViewTag={42}>
      <View testID="profileHeader" />
    </ScrollForwarderView>,
  )

  expect(isScrollForwarderAvailable).toBe(false)
  expect(result.getByTestId('profileHeader')).toBeTruthy()
  expect(result.queryByTestId('nativeForwarder')).toBeNull()
})
