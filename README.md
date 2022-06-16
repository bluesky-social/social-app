# Social App

In-progress social app.

Uses:

- [React Native](https://reactnative.dev)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [React Navigation](https://reactnative.dev/docs/navigation#react-navigation)
- [MobX](https://mobx.js.org/README.html) and [MobX State Tree](https://mobx-state-tree.js.org/)
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
  - On M1 macs, you need to exclude "arm64" from the target architectures
    - Annoyingly this must be re-set via XCode after every pod install

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

For native builds, we must provide a polyfill of `webcrypto`. We use [react-native-securerandom](https://github.com/robhogan/react-native-securerandom) for the CRNG and [msrcrypto](https://github.com/kevlened/msrCrypto) for the cryptography.

**NOTE** Keys are not currently stored securely.

### Polyfills

`./platform/polyfills.*.ts` adds polyfills to the environment. Currently this includes:

- webcrypto
- TextEncoder / TextDecoder