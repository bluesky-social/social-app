# Social App

In-progress social app.

Uses:

- [React Native](https://reactnative.dev)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [React Navigation](https://reactnative.dev/docs/navigation#react-navigation)
- [MobX](https://mobx.js.org/README.html)
- [Async Storage](https://github.com/react-native-async-storage/async-storage)

## Build instructions

- Setup your environment [using the react native instructions](https://reactnative.dev/docs/environment-setup).
- After initial setup:
  - `cd ios ; pod install`
- Start the dev servers
  - `yarn dev-pds`
  - `yarn dev-wallet`
- Run the dev app
  - iOS: `yarn ios`
  - Android: `yarn android`
  - Web: `yarn web`
- Tips
  - `npx react-native info` Checks what has been installed.
  - On M1 macs, [you need to exclude "arm64" from the target architectures](https://stackoverflow.com/a/65399525)
    - Annoyingly this must be re-set via XCode after every pod install
  - The android simulator won't be able to access localhost services unless you run `adb reverse tcp:{PORT} tcp:{PORT}`
    - For instance, the localhosted dev-wallet will need `adb reverse tcp:3001 tcp:3001`
  - For some reason, the typescript compiler chokes on platform-specific files (e.g. `foo.native.ts`) but only when compiling for Web thus far. Therefore we always have one version of the file which doesn't use a platform specifier, and that should bee the Web version. ([More info](https://stackoverflow.com/questions/44001050/platform-specific-import-component-in-react-native-with-typescript).)

## Various notes

### Polyfills

`./platform/polyfills.*.ts` adds polyfills to the environment. Currently this includes:

- TextEncoder / TextDecoder
