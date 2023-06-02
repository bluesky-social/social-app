# Build instructions

## App Build

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
- If you are cloning or forking this repo as an open source developer, please check the tips below as well
- Run e2e tests
  - Start in various console tabs:
    - `yarn e2e:mock-server`
    - `yarn e2e:metro`
  - Run once: `yarn e2e:build`
  - Each test run: `yarn e2e:run`
- Tips
  - Make sure you copy the `.env.example` to `.env` and add the appropriate tokens (e.g. `SENTRY_AUTH_TOKEN` can be created on the Sentry dashboard). If this is not required, you can remove it from `eas.json` and `package.json`, as well as any mentions in the code. Please check the section below on how to remove Sentry from the codebase
  - If you want to use Expo EAS on your own builds without ejecting from Expo, make sure to change the `owner` as well as `extra.eas.projectId` properties. If you do not have an Expo account, you may remove these properties.
  - `npx react-native info` Checks what has been installed.
  - The android simulator won't be able to access localhost services unless you run `adb reverse tcp:{PORT} tcp:{PORT}`
    - For instance, the locally-hosted dev-wallet will need `adb reverse tcp:3001 tcp:3001`
  - For some reason, the typescript compiler chokes on platform-specific files (e.g. `foo.native.ts`) but only when compiling for Web thus far. Therefore we always have one version of the file which doesn't use a platform specifier, and that should be the Web version. ([More info](https://stackoverflow.com/questions/44001050/platform-specific-import-component-in-react-native-with-typescript).)

### Removing Sentry
If you are part of the Bluesky team, you should have access to our Sentry dashboard, and you shouldn't need to remove Sentry. Even if you are not part of the Bluesky team, you can create your own Sentry account and add the `SENTRY_AUTH_TOKEN` env var and add your sentry account detials to `app.json` to make the app build and run successfully. However, if that is not possible, follow these steps to remove Sentry from the project (please don't commit this code in any PR):
- `yarn remove sentry-expo @sentry/react-native`
- Remove `sentry-expo` plugin in `app.json` and also remove the `postPublish` hook in `app.json`
- Remove any mentions of `sentry` from the `App.native.tsx`, `App.web.tsx` and `Navigation.tsx` files. Also, delete `sentry.ts`
- Run `rm -rf ios android` or delete the existing `android` and `ios` folders in the project (don't worry! `yarn prebuild` gets these back)
- Run `yarn prebuild` and `yarn ios` and build the app!

## Go-Server Build

### Prerequisites

- [Go](https://go.dev/)
- [Yarn](https://yarnpkg.com/)

### Steps

To run the build with Go, use staging credentials, your own, or any other account you create.

```
cd social-app
yarn && yarn build-web
cp ./web-build/static/js/*.* bskyweb/static/js/
cd bskyweb/
go mod tidy
go build -v -tags timetzdata -o bskyweb ./cmd/bskyweb
./bskyweb serve --pds-host=https://staging.bsky.dev --handle=<HANDLE> --password=<PASSWORD>
```

On build success, access the application at [http://localhost:8100/](http://localhost:8100/). Subsequent changes require re-running the above steps in order to be reflected.

## Various notes

### Debugging

- Note that since 0.70, debugging using the old debugger (which shows up using CMD+D) doesn't work anymore. Follow the instructions below to debug the code: https://reactnative.dev/docs/next/hermes#debugging-js-on-hermes-using-google-chromes-devtools

### Developer Menu

To open the [Developer Menu](https://docs.expo.dev/debugging/tools/#developer-menu) on an `expo-dev-client` app you can do the following:

- Android Device: Shake the device vertically, or if your device is connected via USB, run adb shell input keyevent 82 in your terminal
- Android Emulator: Either press Cmd ⌘ + m or Ctrl + m or run adb shell input keyevent 82 in your terminal
- iOS Device: Shake the device, or touch 3 fingers to the screen
- iOS Simulator: Press Ctrl + Cmd ⌘ + z on a Mac in the emulator to simulate the shake gesture, or press Cmd ⌘ + d

### Running E2E Tests

- Make sure you've setup your environment following above
- Make sure Metro and the dev server are running
- Run `yarn e2e`
- Find the artifacts in the `artifact` folder

### Polyfills

`./platform/polyfills.*.ts` adds polyfills to the environment. Currently this includes:

- TextEncoder / TextDecoder

### Sentry sourcemaps

Sourcemaps should automatically be updated when a signed build is created using `eas build` and published using `eas submit` due to the postPublish hook setup in `app.json`. However, if an update is created and published OTA using `eas update`, we need to the take the following steps to upload sourcemaps to Sentry:

- Run eas update. This will generate a dist folder in your project root, which contains your JavaScript bundles and source maps. This command will also output the 'Android update ID' and 'iOS update ID' that we'll need in the next step.
- Copy or rename the bundle names in the `dist/bundles` folder to match `index.android.bundle` (Android) or `main.jsbundle` (iOS).
- Next, you can use the Sentry CLI to upload your bundles and source maps:
  - release name should be set to `${bundleIdentifier}@${version}+${buildNumber}` (iOS) or `${androidPackage}@${version}+${versionCode}` (Android), so for example `com.domain.myapp@1.0.0+1`.
  - `dist` should be set to the Update ID that `eas update` generated.
- Command for Android:
  `node_modules/@sentry/cli/bin/sentry-cli releases \
files <release name> \
upload-sourcemaps \
--dist <Android Update ID> \
--rewrite \
dist/bundles/index.android.bundle dist/bundles/android-<hash>.map`
- Command for iOS:
  `node_modules/@sentry/cli/bin/sentry-cli releases \
files <release name> \
upload-sourcemaps \
--dist <iOS Update ID> \
--rewrite \
dist/bundles/main.jsbundle dist/bundles/ios-<hash>.map`

### OTA updates
To create OTA updates, run `eas update` along with the `--branch` flag to indicate which branch you want to push the update to, and the `--message` flag to indicate a message for yourself and your team that shows up on https://expo.dev. ALl the channels (which make up the options for the `--branch` flag) are given in `eas.json`. [See more here](https://docs.expo.dev/eas-update/getting-started/)

The clients which can receive an OTA update is governed by the `runtimeVersion` property in `app.json`. Right now, it is set so that only apps with the same `appVersion` (same as `version` property in `app.json`) can receive the update and install it. However, we can manually set `"runtimeVersion": "1.34.0"` or anything along those lines as well. This is useful if very little native code changes from update-to-update. If we are manually setting `runtimeVersion`, we should increment the version each time native code is changed. [See more here](https://docs.expo.dev/eas-update/runtime-versions/)
