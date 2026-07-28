import {launchCameraAsync} from 'expo-image-picker'

import {openCamera} from '../picker'

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
}))
jest.mock('@bsky.app/expo-image-crop-tool', () => ({}))
jest.mock('../picker.shared', () => ({}))

const mockLaunchCameraAsync = jest.mocked(launchCameraAsync)

describe('openCamera', () => {
  it('returns undefined when the user cancels', async () => {
    mockLaunchCameraAsync.mockResolvedValue({
      assets: null,
      canceled: true,
    })

    await expect(openCamera({})).resolves.toBeUndefined()
  })

  it('maps the selected image', async () => {
    mockLaunchCameraAsync.mockResolvedValue({
      assets: [
        {
          uri: 'file:///photo.jpg',
          width: 1200,
          height: 800,
          mimeType: 'image/jpeg',
          fileSize: 1234,
        },
      ],
      canceled: false,
    })

    await expect(openCamera({})).resolves.toEqual({
      path: 'file:///photo.jpg',
      width: 1200,
      height: 800,
      mime: 'image/jpeg',
      size: 1234,
    })
  })
})
