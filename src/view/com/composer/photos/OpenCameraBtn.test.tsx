import {PermissionStatus} from 'expo'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, waitFor} from '@testing-library/react-native'

import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {Asset, usePermissions} from '#/lib/media/media-library'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {createComposerImage} from '#/state/gallery'
import * as env from '#/env'
import {OpenCameraBtn} from './OpenCameraBtn'

jest.mock('expo', () => ({
  PermissionStatus: {DENIED: 'denied'},
}))
jest.mock('#/env', () => ({
  __esModule: true,
  IS_ANDROID: true,
  IS_NATIVE: true,
}))
jest.mock('#/lib/hooks/usePermissions', () => ({
  useCameraPermission: jest.fn(),
}))
jest.mock('#/lib/media/media-library', () => ({
  Asset: {create: jest.fn()},
  usePermissions: jest.fn(),
}))
jest.mock('#/lib/media/picker', () => ({openCamera: jest.fn()}))
jest.mock('#/logger', () => ({logger: {warn: jest.fn()}}))
jest.mock('#/state/gallery', () => ({createComposerImage: jest.fn()}))
jest.mock('#/alf', () => ({
  atoms: {p_sm: {}},
  useTheme: () => ({atoms: {text_contrast_low: {}}}),
}))
jest.mock('#/components/Button', () => ({
  Button: ({
    onPress,
    label,
    accessibilityHint,
    disabled,
  }: {
    onPress: () => void
    label: string
    accessibilityHint?: string
    disabled?: boolean
  }) => {
    const {Pressable} = jest.requireActual('react-native')
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        disabled={disabled}
      />
    )
  },
}))
jest.mock('#/components/icons/Camera', () => ({
  Camera_Stroke2_Corner0_Rounded: () => null,
}))

const i18n = setupI18n({locale: 'en', messages: {en: {}}})
const image = {
  path: 'file:///camera.jpg',
  mime: 'image/jpeg',
  size: 100,
  width: 100,
  height: 100,
}
const composerImage = {alt: '', source: {...image, id: 'camera-image'}}
const requestMediaPermission = jest.fn()

function takePicture() {
  const onAdd = jest.fn()
  const screen = render(
    <I18nProvider i18n={i18n}>
      <OpenCameraBtn onAdd={onAdd} />
    </I18nProvider>,
  )
  fireEvent.press(screen.getByLabelText('Camera'))
  return onAdd
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.replaceProperty(env, 'IS_ANDROID', true)
  jest.mocked(useCameraPermission).mockReturnValue({
    requestCameraAccessIfNeeded: jest.fn().mockResolvedValue(true),
  })
  jest.mocked(usePermissions).mockReturnValue([
    {
      granted: false,
      status: PermissionStatus.DENIED,
      canAskAgain: false,
      expires: 'never',
    },
    requestMediaPermission,
    jest.fn(),
  ])
  jest.mocked(openCamera).mockResolvedValue(image)
  jest.mocked(createComposerImage).mockResolvedValue(composerImage)
})

it('saves an Android camera photo even when library read access was denied', async () => {
  const onAdd = takePicture()

  await waitFor(() => expect(onAdd).toHaveBeenCalledWith([composerImage]))
  expect(Asset.create).toHaveBeenCalledWith(image.path)
  expect(requestMediaPermission).not.toHaveBeenCalled()
})

it('keeps the captured photo in the composer if the library save fails', async () => {
  const error = new Error('Unable to save photo')
  jest.mocked(Asset.create).mockRejectedValueOnce(error)
  const onAdd = takePicture()

  await waitFor(() => expect(onAdd).toHaveBeenCalledWith([composerImage]))
  expect(logger.warn).toHaveBeenCalledWith(
    'Failed to save camera image to media library',
    {safeMessage: error},
  )
})

it('does not bypass the permission gate on iOS', async () => {
  jest.replaceProperty(env, 'IS_ANDROID', false)
  const onAdd = takePicture()

  await waitFor(() => expect(onAdd).toHaveBeenCalledWith([composerImage]))
  expect(Asset.create).not.toHaveBeenCalled()
})

it('does not save or attach anything when the camera is cancelled', async () => {
  jest.mocked(openCamera).mockResolvedValueOnce(undefined)
  const onAdd = takePicture()

  await waitFor(() => expect(openCamera).toHaveBeenCalled())
  expect(Asset.create).not.toHaveBeenCalled()
  expect(createComposerImage).not.toHaveBeenCalled()
  expect(onAdd).not.toHaveBeenCalled()
})
