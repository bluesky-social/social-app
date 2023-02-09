import {getYoutubeVideoId} from './../../src/view/com/util/PostEmbeds/getYoutubeVideoId'
describe('getYoutubeVideoId', () => {
  it('should return undefined for invalid youtube links', () => {
    expect(getYoutubeVideoId('')).toBeUndefined()
    expect(getYoutubeVideoId('https://www.google.com')).toBeUndefined()
    expect(getYoutubeVideoId('https://www.youtube.com')).toBeUndefined()
    expect(
      getYoutubeVideoId('https://www.youtube.com/channelName'),
    ).toBeUndefined()
    expect(
      getYoutubeVideoId('https://www.youtube.com/channel/channelName'),
    ).toBeUndefined()
  })

  it('should return video id for valid youtube links', () => {
    expect(getYoutubeVideoId('https://www.youtube.com/watch?v=videoId')).toBe(
      'videoId',
    )
    expect(
      getYoutubeVideoId(
        'https://www.youtube.com/watch?v=videoId&feature=share',
      ),
    ).toBe('videoId')
    expect(getYoutubeVideoId('https://youtu.be/videoId')).toBe('videoId')
  })
})
