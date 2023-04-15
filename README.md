# Bluesky

## Build instructions

- Setup your environment [using the react native instructions](https://reactnative.dev/docs/environment-setup).
- Setup your environment [for e2e testing using detox](https://wix.github.io/Detox/docs/introduction/getting-started):
  - yarn global add detox-cli
  - brew tap wix/brew
  - brew install applesimutils
- After initial setup:
  - `npx expo prebuild` -> you will also need to run this anytime `app.json` or `package.json` changes
- Start the dev servers
  - `git clone git@github.com:bluesky-social/atproto.git`
  - `cd atproto`
  - `yarn`
  - `cd packages/dev-env && yarn start`
- Run the dev app
  - iOS: `yarn ios`
  - Android: `yarn android`
  - Web: `yarn web`
- Run e2e tests
  - Start in various console tabs:
    - `yarn e2e:server`
    - `yarn e2e:metro`
  - Run once: `yarn e2e:build`
  - Each test run: `yarn e2e:run`
- Tips
  - `npx react-native info` Checks what has been installed.
  - The android simulator won't be able to access localhost services unless you run `adb reverse tcp:{PORT} tcp:{PORT}`
    - For instance, the localhosted dev-wallet will need `adb reverse tcp:3001 tcp:3001`
  - For some reason, the typescript compiler chokes on platform-specific files (e.g. `foo.native.ts`) but only when compiling for Web thus far. Therefore we always have one version of the file which doesn't use a platform specifier, and that should bee the Web version. ([More info](https://stackoverflow.com/questions/44001050/platform-specific-import-component-in-react-native-with-typescript).)

## Various notes

### Debugging

- Note that since 0.70, debugging using the old debugger (which shows up using CMD+D) doesn't work anymore. Follow the instructions below to debug the code: https://reactnative.dev/docs/next/hermes#debugging-js-on-hermes-using-google-chromes-devtools

### Running E2E Tests

- Make sure you've setup your environment following above
- Make sure Metro and the dev server are running
- Run `yarn e2e`
- Find the artifacts in the `artifact` folder

### Polyfills

`./platform/polyfills.*.ts` adds polyfills to the environment. Currently this includes:

- TextEncoder / TextDecoder
