import {compress, probe} from '@bsky.app/video-compressor'

import {compressVideo} from '../compress'

jest.mock('@bsky.app/video-compressor', () => ({
  compress: jest.fn(),
  probe: jest.fn(),
}))

const mockCompress = jest.mocked(compress)
const mockProbe = jest.mocked(probe)

const asset = {
  uri: 'file:///video.mov',
  width: 1920,
  height: 1080,
  type: 'video' as const,
  mimeType: 'video/quicktime',
  fileSize: 10 * 1024 * 1024,
}

const metadata = {
  width: 1920,
  height: 1080,
  duration: 10,
  bitrate: 8_000_000,
  fileSize: asset.fileSize,
  mimeType: asset.mimeType,
  codec: 'hevc',
  hasAudio: true,
  frameRate: 30,
  rotation: 0,
  isHDR: false,
}

describe('compressVideo', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('compresses an HDR video below the normal byte threshold', async () => {
    mockProbe.mockResolvedValue({...metadata, isHDR: true})
    mockCompress.mockResolvedValue({
      uri: 'file:///compressed.mp4',
      size: 5_000_000,
      mimeType: 'video/mp4',
    })

    await compressVideo(asset)

    expect(mockCompress).toHaveBeenCalledWith(
      asset.uri,
      expect.objectContaining({passthroughBelowBytes: 0}),
      expect.any(Object),
    )
  })

  it('still skips a non-HDR video below the byte threshold', async () => {
    mockProbe.mockResolvedValue(metadata)

    await expect(compressVideo(asset)).resolves.toMatchObject({
      uri: asset.uri,
      passthroughReason: 'below-byte-threshold',
    })
    expect(mockCompress).not.toHaveBeenCalled()
  })
})
