/*
 * Used ONLY by the Android typecheck pass (tsconfig.check.android.json) - it
 * is excluded from the other passes and has no runtime effect.
 *
 * react-native-device-attest's Android variant implements only the Play
 * Integrity statics, so the iOS-only getDeviceCheckToken (whose app call
 * site is IS_IOS-guarded) fails to resolve under .android module suffixes.
 * Pin the module to its platform-neutral base class, which declares the
 * full API surface.
 */
declare module 'react-native-device-attest' {
  export {DeviceAttestBase as default} from 'react-native-device-attest/build/DeviceAttestBase'
}
