# Social App

In-progress social app.

Uses:

- [React Native](https://reactnative.dev)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [React Navigation](https://reactnative.dev/docs/navigation#react-navigation)
- [MobX](https://mobx.js.org/README.html)
- [Async Storage](https://github.com/react-native-async-storage/async-storage)

## TODOs

- Handle the "unauthed" state better than changing route definitions
  - Currently it's possible to get a 404 if the auth state changes

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

### Env vars

Set using the `.env` file or using bash.

```
REACT_APP_AUTH_LOBBY = 'http://localhost:3001'
```

### Build behaviors

The `metro.config.js` file rewrites a couple of imports. This is partly to work around missing features in Metro, and partly to patch the bundle. Affected imports include:

- ucans
- one-webcrypto

### Cryptography

For native builds, we must provide a polyfill of `webcrypto`. We use a custom native module AppSecureRandom (based on [react-native-securerandom](https://github.com/robhogan/react-native-securerandom)) for the CRNG and [msrcrypto](https://github.com/microsoft/MSR-JavaScript-Crypto) for the cryptography.

**NOTE** Keys are not currently stored securely.

### Polyfills

`./platform/polyfills.*.ts` adds polyfills to the environment. Currently this includes:

- webcrypto
- TextEncoder / TextDecoder

### Auth flow

The auth flow is based on a browser app which is specified by the `REACT_APP_AUTH_LOBBY` env var. The app redirects to that location with the UCAN request, and then waits for a redirect back. In the native platforms with proper support, it will do this using an in-app browser. In native without in-app browser, or in the Web platform, it will handle this with redirects. The ucan is extracted from the hash fragment of the "return url" which is provided either by the in-app browser in response or detected during initial setup in the case of redirects.