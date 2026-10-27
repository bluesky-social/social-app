import {PermissionStatus} from 'expo'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {renderHook} from '@testing-library/react-native'

import {requestPermissionsAsync} from '#/lib/media/media-library'
import * as Toast from '#/components/Toast'
import {saveImageToMediaLibrary} from './manip'
import {useSaveImageToMediaLibrary} from './save-image.ios'

jest.mock('expo', () => ({
  PermissionStatus: {GRANTED: 'granted', DENIED: 'denied'},
}))
jest.mock('#/env', () => ({IS_NATIVE: true}))
jest.mock('#/lib/media/media-library', () => ({
  requestPermissionsAsync: jest.fn(),
}))
jest.mock('./manip', () => ({saveImageToMediaLibrary: jest.fn()}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))

const i18n = setupI18n({locale: 'en', messages: {en: {}}})
const uri = 'https://example.com/image.jpg'

function renderSaveImage() {
  return renderHook(useSaveImageToMediaLibrary, {
    wrapper: ({children}) => (
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    ),
  }).result
}

beforeEach(() => {
  jest.resetAllMocks()
})

it('waits for add-only permission before saving and does not request on mount', async () => {
  let grantPermission!: () => void
  jest.mocked(requestPermissionsAsync).mockImplementation(
    () =>
      new Promise(resolve => {
        grantPermission = () =>
          resolve({
            granted: true,
            status: PermissionStatus.GRANTED,
            canAskAgain: true,
            expires: 'never',
          })
      }),
  )
  const result = renderSaveImage()
  expect(requestPermissionsAsync).not.toHaveBeenCalled()

  const saving = result.current(uri)
  expect(requestPermissionsAsync).toHaveBeenCalledWith(true)
  expect(saveImageToMediaLibrary).not.toHaveBeenCalled()
  grantPermission()
  await saving

  expect(saveImageToMediaLibrary).toHaveBeenCalledWith({uri})
  expect(Toast.show).toHaveBeenCalledWith('Image saved')
})

it('reports denial without downloading and retries permission on the next save', async () => {
  jest.mocked(requestPermissionsAsync).mockResolvedValueOnce({
    granted: false,
    status: PermissionStatus.DENIED,
    canAskAgain: false,
    expires: 'never',
  })
  const result = renderSaveImage()

  await result.current(uri)

  expect(saveImageToMediaLibrary).not.toHaveBeenCalled()
  expect(Toast.show).toHaveBeenCalledWith(
    'Permission to access your photo library was denied. Please enable it in your system settings.',
    {type: 'error'},
  )

  jest.mocked(requestPermissionsAsync).mockResolvedValueOnce({
    granted: true,
    status: PermissionStatus.GRANTED,
    canAskAgain: true,
    expires: 'never',
  })
  await result.current(uri)

  expect(requestPermissionsAsync).toHaveBeenCalledTimes(2)
  expect(saveImageToMediaLibrary).toHaveBeenCalledWith({uri})
})

it('reports permission request failures without saving', async () => {
  jest
    .mocked(requestPermissionsAsync)
    .mockRejectedValueOnce(new Error('Permission request failed'))
  const result = renderSaveImage()

  await result.current(uri)

  expect(saveImageToMediaLibrary).not.toHaveBeenCalled()
  expect(Toast.show).toHaveBeenCalledWith(
    'Failed to save image: Error: Permission request failed',
    {type: 'error'},
  )
})
