# Build instructions

## Running Web App

- `yarn`
- `yarn web`

You're all set!

## iOS/Android Build

### Native Environment Setup

This is NOT required when developing for web.

- Set up your environment [using the expo instructions](https://docs.expo.dev/guides/local-app-development/).
  - make sure that the JAVA_HOME points to the zulu-17 directory in your `.zshrc` or `.bashrc` file: `export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`. DO NOT use another JDK or you will encounter build errors.
- If you're running macOS, make sure you are running the correct versions of Ruby and Cocoapods:-
  - If you are using Apple Silicon and this is the first time you are building for RN 0.74+, you may need to run:
    - `arch -arm64 brew install llvm`
    - `sudo gem install ffi`
  - Check if you've installed Cocoapods through `homebrew`. If you have, remove it:
    - `brew info cocoapods`
    - If output says `Installed`:
    - `brew remove cocoapods`
  - If you use asdf-vm, see instructions below, otherwise, if you have not installed `rbenv`:
    - `brew install rbenv`
    - `rbenv install 2.7.6`
    - `rbenv global 2.7.6`
    - Add `eval "$(rbenv init - zsh)"` to your `~/.zshrc`
  - Alternatively, you can use ASDF for version management:
    - A `.tool-versions` file is included in the repo
    - [Install ASDF](https://asdf-vm.com/) according to their documentation
    - Add the Ruby plugin: `asdf plugin add ruby`
    - Install the required Ruby version: `asdf install`
    - ASDF will automatically use the correct Ruby version based on the `.tool-versions` file
  - From inside the project directory:
    - `bundler install` (this will install Cocoapods)
- After initial setup:
  - Copy `google-services.json.example` to `google-services.json` or provide your own `google-services.json`. (A real firebase project is NOT required)
  - `npx expo prebuild` -> you will also need to run this anytime `app.json` or native `package.json` deps change

### Running the Native App

- iOS: `yarn ios`
  - Xcode must be installed for this to run.
    - A simulator must be preconfigured in Xcode settings.
      - if no iOS versions are available, install the iOS runtime at `Xcode > Settings > Platforms`.
      - if the simulator download keeps failing you can download it from the developer website.
        - [Apple Developer](https://developer.apple.com/download/all/?q=Simulator%20Runtime)
        - `xcode-select -s /Applications/Xcode.app`
        - `xcodebuild -runFirstLaunch`
        - `xcrun simctl runtime add "~/Downloads/iOS_17.4_Simulator_Runtime.dmg"` (adapt the path to the downloaded file)
    - In addition, ensure Xcode Command Line Tools are installed using `xcode-select --install`.
  - Expo will require you to configure Xcode Signing. Follow the linked instructions. Error messages in Xcode related to the signing process can be safely ignored when installing on the iOS Simulator; Expo merely requires the profile to exist in order to install the app on the Simulator.
    - Make sure you do have a certificate: open Xcode > Settings > Accounts > (sign-in) > Manage Certificates > + > Apple Development > Done.
    - For more information on setting up signing certificates: [Expo: Setup Code Signing Certificates in Xcode for Development](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md)
    - If you still encounter issues, try `rm -rf ios` before trying to build again (`yarn ios`)
- Android: `yarn android`
  - Install "Android Studio"
    - Make sure you have the Android SDK installed (`Android Studio > Settings > Tools > Android SDK`).
      - In "SDK Platforms": "Android x" (where x is Android's current version).
      - In "SDK Tools": "Android SDK Build-Tools" and "Android Emulator" are required.
      - Add `export ANDROID_HOME=/Users/<your_username>/Library/Android/sdk` to your `.zshrc` or `.bashrc` (and restart your terminal).
    - Setup an emulator (Android Studio > Tools > Device Manager).
  - Common JDK Version Issue:
    - If you encounter a build error like:

      `BUILD FAILED Inconsistent JVM-target compatibility detected for tasks 'compileDebugJavaWithJavac' (<desired_version>) and 'compileDebugKotlin' (<your_local_jdk_version>).`

    - *Note that these changes may affect your other Java, Android, or React Native projects that require different JDK versions. You'll likely encounter this issue if your `.zshrc` or `.bashrc` already has a different OpenJDK version in your PATH.*
    - Follow these steps to fix JDK version mismatch (replace `<desired_version>` with the version number from the error):
      1. Install the required JDK version:

         ```
         brew install openjdk@<desired_version>
         ```

      2. Create a symbolic link (requires admin privileges):

         ```
         sudo ln -sfn /opt/homebrew/opt/openjdk@<desired_version>/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-<desired_version>.jdk
         ```

      3. Add JDK to your path (for zsh or bash):

         ```
         # For zsh
         echo 'export PATH="/opt/homebrew/opt/openjdk@<desired_version>/bin:$PATH"' >> ~/.zshrc
         
         # For bash
         echo 'export PATH="/opt/homebrew/opt/openjdk@<desired_version>/bin:$PATH"' >> ~/.bashrc
         ```

      4. Set C/C++ flags for the JDK:

         ```
         export CPPFLAGS="-I/opt/homebrew/opt/openjdk@<desired_version>/include"
         ```

      5. Open and edit your shell config if needed:

         ```
         code ~/.zshrc   # or ~/.bashrc for bash users
         ```

      6. Apply changes and verify JDK version:

         ```
         source ~/.zshrc   # or ~/.bashrc for bash users
         java --version
         ```

- Web: `yarn web` (see the top of this file).

After you do `yarn ios` and `yarn android` once, you can later just run `yarn web` and then press either `i` or `a` to open iOS and Android emulators respectively which is much faster. However, if you make native changes, you'll have to do `yarn prebuild -p ios` and `yarn prebuild -p android` and then `yarn ios` and `yarn android` again before you can continue with the same workflow.

### Tips

- Copy the `.env.example` to `.env` and fill in any necessary tokens. (The Sentry token is NOT required; see instructions below if you want to enable Sentry.)
- To run on the device, add `--device` to the command (e.g. `yarn android --device`). To build in production mode (slower build, faster app), also add `--variant release` on Android or `--configuration Release` on iOS.
- If you want to use Expo EAS on your own builds without ejecting from Expo, make sure to change the `owner` and `extra.eas.projectId` properties. If you do not have an Expo account, you may remove these properties.
- `npx react-native info` Checks what has been installed.
- If the Android simulator frequently hangs or is very sluggish, [bump its memory limit](https://stackoverflow.com/a/40068396)
- The Android simulator won't be able to access localhost services unless you run `adb reverse tcp:{PORT} tcp:{PORT}`
  - For instance, the locally-hosted dev-wallet will need `adb reverse tcp:3001 tcp:3001`
- For some reason, the typescript compiler chokes on platform-specific files (e.g. `foo.native.ts`) but only when compiling for Web thus far. Therefore we always have one version of the file that doesn't use a platform specifier, and that should be the Web version. ([More info](https://stackoverflow.com/questions/44001050/platform-specific-import-component-in-react-native-with-typescript).)

### When in doubt, throw it out 🧨

Sometimes the most effective fix for stubborn React Native/Expo issues is the nuclear option. If you've tried everything else and are still encountering mysterious errors:

```
# Clear Expo's cache
npx expo start --clear

# Remove platform-specific build directories
rm -rf /ios     # For iOS issues
rm -rf /android # For Android issues

# The ultimate reset
rm -rf /node_modules
yarn install    # Don't forget to reinstall!
```

![Throwing garbage away](https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzh6eTRhMjYyaGtqa2Z2anU2aTBueXR6aXRpNmQ4eXVlZHBrajJkbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/p39qWGHTpfY0o/giphy.gif)

Sometimes a fresh start is all you need... and much faster than debugging for hours!

### Running E2E Tests

- Start in various console tabs:
  - `yarn e2e:mock-server`
  - `yarn e2e:start`
- Run once: `yarn e2e:build`
- Each test run: `yarn e2e:run`

### Adding Sentry

Adding Sentry is NOT required. You can keep `SENTRY_AUTH_TOKEN=` in `.env` which will build the app without Sentry.

However, if you're a part of the Bluesky team and want to enable Sentry, fill in `SENTRY_AUTH_TOKEN` in your `.env`. It can be created on the Sentry dashboard using [these instructions](https://docs.expo.dev/guides/using-sentry/#sign-up-for-a-sentry-account-and-create-a-project).

If you change `SENTRY_AUTH_TOKEN`, you need to do `yarn prebuild` before running `yarn ios` or `yarn android` again.

### Adding bitdrift

Adding bitdrift is NOT required. You can keep `EXPO_PUBLIC_BITDRIFT_API_KEY=` in `.env` which will avoid initializing bitdrift during startup.

However, if you're a part of the Bluesky team and want to enable bitdrift, fill in `EXPO_PUBLIC_BITDRIFT_API_KEY` in your `.env` to enable bitdrift.

### Adding and Updating Locales

- `yarn intl:build` -> you will also need to run this anytime `./src/locale/{locale}/messages.po` change

## Running the Backend Locally

This is NOT required for app development but if you also want to develop the Bluesky *backend* locally too, you'll need this.

- Start the dev servers
  - `git clone git@github.com:bluesky-social/atproto.git`
  - `cd atproto`
  - `brew install pnpm`
  - optional: `brew install jq`
  - `pnpm i`
  - `pnpm build`
  - Start the docker daemon (on MacOS this entails starting the Docker Desktop app)
  - Launch a Postgres database on port 5432
  - `cd packages/dev-env && pnpm start`
  
Run the account with the AppView proxy DID passed in as an environment variable: `EXPO_PUBLIC_BLUESKY_PROXY_DID=did:plc:dw4kbjf5mn7nhenabiqpkyh3 yarn start`

Then, when logging in or creating an account, point it to the localhost port of the devserver.

## Go-Server Build

The Go server in this repository is only used for serving the web app in production. Usually you won't need to touch it.

### Prerequisites

- [Go](https://go.dev/)
- [Yarn](https://yarnpkg.com/)

### Steps

To run the build with Go, use staging credentials, your own, or any other account you create.

```
cd social-app
yarn && yarn build-web
cd bskyweb/
go mod tidy
go build -v -tags timetzdata -o bskyweb ./cmd/bskyweb
./bskyweb serve --appview-host=https://public.api.bsky.app
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
- iOS Simulator: Press Ctrl + Cmd ⌘ + z on a Mac in the emulator to simulate the shake gesture or press Cmd ⌘ + d

### Running E2E Tests

See [testing.md](./testing.md).

### Polyfills

`./platform/polyfills.*.ts` adds polyfills to the environment. Currently, this includes:

- TextEncoder / TextDecoder
- react-native-url-polyfill
- Array#findLast (on web)

### Sentry sourcemaps

Sourcemaps should automatically be updated when a signed build is created using `eas build` and published using `eas submit` due to the postPublish hook setup in `app.json`. However, if an update is created and published OTA using `eas update`, we need to take the following steps to upload sourcemaps to Sentry:

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

To create OTA updates, run `eas update` along with the `--branch` flag to indicate which branch you want to push the update to, and the `--message` flag to indicate a message for yourself and your team that shows up on https://expo.dev. All the channels (which make up the options for the `--branch` flag) are given in `eas.json`. [See more here](https://docs.expo.dev/eas-update/getting-started/)

The clients which can receive an OTA update are governed by the `runtimeVersion` property in `app.json`. Right now, it is set so that only apps with the same `appVersion` (same as `version` property in `app.json`) can receive the update and install it. However, we can manually set `"runtimeVersion": "1.34.0"` or anything along those lines as well. This is useful if very little native code changes from update to update. If we are manually setting `runtimeVersion`, we should increment the version each time the native code is changed. [See more here](https://docs.expo.dev/eas-update/runtime-versions/)
