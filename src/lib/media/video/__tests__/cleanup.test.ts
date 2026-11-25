import {isLegacyCompressedVideo} from '../cleanup'

describe('isLegacyCompressedVideo', () => {
  it('matches compressor outputs from iOS and Android', () => {
    expect(
      isLegacyCompressedVideo('3F2504E0-4F89-11D3-9A0C-0305E82C3301.mp4'),
    ).toBe(true)
    expect(
      isLegacyCompressedVideo('3f2504e0-4f89-11d3-9a0c-0305e82c3301.mp4'),
    ).toBe(true)
  })

  it('ignores other files', () => {
    expect(
      isLegacyCompressedVideo('3f2504e0-4f89-11d3-9a0c-0305e82c3301.mov'),
    ).toBe(false)
    expect(isLegacyCompressedVideo('video.mp4')).toBe(false)
    expect(
      isLegacyCompressedVideo('x3f2504e0-4f89-11d3-9a0c-0305e82c3301.mp4'),
    ).toBe(false)
  })
})
