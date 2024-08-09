/**
 * Sets the audio session category on iOS. In general, we should only need to use this for the `playback` and `ambient`
 * categories. This enum however includes other categories that are available in the native API for clarity and
 * potential future use.
 * @see https://developer.apple.com/documentation/avfoundation/avaudiosession/category
 * @platform ios
 */
export enum AudioCategory {
  Ambient = 'AVAudioSessionCategoryAmbient',
  Playback = 'AVAudioSessionCategoryPlayback',
  _SoloAmbient = 'AVAudioSessionCategorySoloAmbient',
  _Record = 'AVAudioSessionCategoryRecord',
  _PlayAndRecord = 'AVAudioSessionCategoryPlayAndRecord',
  _MultiRoute = 'AVAudioSessionCategoryMultiRoute',
}
