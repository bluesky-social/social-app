# Build instructions

These are the waverly-specific build instructions. We try to keep them in sync with the [bluesky build instructions](./build.md) but if something doesn't work, you can look over there for guidance.

## App Build

- `cd` into the client:
  - `cd w2-client`
- Make sure you have the latest version of `node`:
  - `node -v` -> `v18.16.1`
  - If not, follow the instructions on [nodejs.org](https://nodejs.org).
- Install `yarn` and make sure you have the latest version:
  - `yarn -v` -> `1.22.19`
  - If not: `npm install --global yarn`
- Ensure you have the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html).
  - Note that I (PhilB) am using CLI v1. Everything should work with CLI v2,
    though, and I should really be moving.
  - Configure your [AWS CLI credentials](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html).
    - This is a critical step for creating your `.env` later on!**
    - After completing the above steps, run `aws iam get-user` to verify your credentials are now active.
  - Our default region is `us-east-2`
  - Optionally, [set up aws command completion](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-parameters-prompting.html).
- Set up your environment [for e2e testing using detox](https://wix.github.io/Detox/docs/introduction/getting-started):
  - `yarn global add detox-cli`
  - `brew tap wix/brew`
  - `brew install applesimutils`
- Install dependencies:
  - `yarn install --frozen-lockfile`
- This should have installed `expo`:
  - `npx expo --version` -> `0.7.3`
  - If not, I've had success with `yarn add expo`.
- Create your `.env` file with our Waverly secrets:
  - `yarn env`
  - If this fails, likely your AWS CLI Credentials have not been configured correctly (see above).
  - *** For XCode cloud, the SENTRY_AUTH_TOKEN was added directly to the config as a secret.
- After initial setup:
  - `npx expo prebuild`
  - _Important!_ You will also need to run this anytime `app.config.js` or `package.json` changes
- Start the ATProto dev servers
  - Oct'23 - As of the October Bsky re-sync, the instructions below are no longer valid.  Instead, take the steps [here](https://github.com/waverlyai/atproto/blob/waverly/README_WAVERLY.md#running-the-dev-environment). See our [README_WAVERLY.md](https://github.com/waverlyai/atproto/blob/waverly/README_WAVERLY.md) in that repo if needed.
  - OLD ATProto directions
    - Side-by-side with `news-crawl` clone our fork of [ATProto](https://github.com/waverlyai/atproto)
    - `cd atproto`
    - `git checkout waverly` (Make sure you always use the `waverly` branch)
    - `make deps && make build && make run-dev-env`
    - `cd packages/dev-env && yarn build && yarn start`
  
- Start the Waverly dev server
  - In `/waverly-social/w2-dev` run `npm install && npm start`
- Run the dev app, in another tab, `cd w2-client` and:
  - iOS: `yarn ios`
    - If any build errors occur, check `w2-client/.expo/xcodebuild.log` for detailed logging.
  - Web: `yarn web`
  - Android: `yarn android`

## Running on the Web

Running with `yarn web` on a fresh server:

- `Create a new account` > `Other` > `Dev Server` > `Next`
- `Email`: Your @mywaverly.com email address
- `Password`: Whatever
- `Next`
- Enter your favorite handle

That's it, you're in! You can write posts, etc.

Note that there isn't much you can do here. Most of our screens are for ios only.

## Setting up XCode

For instruction regarding XCode Signing Certificate setup take a look at this [section](https://github.com/waverlyai/core/tree/dev/dilemma2#building-on-device).

For quickly setting up your iOS signing credentials in XCode, [this resource](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md) is also helpful.

## Running on a iPhone

### Using Expo

To run this project on your iPhone:

One-time setup:

- Make sure your device is in Developer Mode (Settings App on your phone, followed by a device restart)
- Connect your device to you laptop using a cable
- _Make sure your device is unlocked!_
- Open XCode (`xed ios` from the `w2-client` directory to open XCode).
- Click on your Device name from the top bar (eg: `iPhone 14 Pro`) and select your device.
- XCode will do some one-time setup for your device.

Now, every time you clone the repo:

- `yarn install --frozen-lockfile` - Install dependencies just like you would for running on simulator.
- `yarn env && npx expo prebuild` - Setup env and build. If you run into error look for info in main build steps above.
- `yarn ios -d` - The `-d` flag instructs expo to run on a device. Make sure you have your device connected, that it is in Developer mode, and _that you have unlocked it_.
- Select your device from the list

```bash
? Select a device ›
❯   🔌 Aman’s iPhone (16.1)
    iPhone 14 (16.4)
    iPhone 14 Plus (16.4)
    iPhone 14 Pro (16.4)
    iPhone 14 Pro Max (16.4)
    iPad Air (5th generation) (16.4)
    iPad (10th generation) (16.4)
    iPad mini (6th generation) (16.4)
    iPad Pro (11-inch) (4th generation) (16.4)
    iPad Pro (12.9-inch) (6th generation) (16.4)
  ↓ iPhone 8 (15.0)
```

and choose Waverly AI for signing.

- Once the build is complete, a QR Code would appear on screen. Scan this from your Camera app and Voila! 🎉

### Using XCode

Alternatively you can you run the project using XCode as well.

- Follow the above steps up until `prebuild`.
- Instead of `yarn ios -d`, do `xed ios` from `w2-client` to open XCode.
- If its your first time, double click on `Waverly` from the left pane. Go to `General` tab and select `Waverly AI` as Team under Signing.
- Now, click on Device name from the top bar (eg: `iPhone 14 Pro`) and select your device.
- You could also customize build scheme by going to Product > Edit Scheme. Generally you should have `Build Configuration: Release` and unchecked `Debug executable`. (Note: If you want to attach the debugger you'd have to enable this option and also select `Debug` in `Build Configuration`).
- If you're all set, tap on the ▶️ from the top pane, and you should have the app running.

## Testing

I have not tried the E2E Tests yet, but you should be able to run the simpler unit tests:

```sh
yarn test
```

If you want to limit the tests to the waverly ones:

```sh
yarn test:waverly
```

## Something is not working?

Check the [bluesky build instructions](https://github.com/bluesky-social/social-app/blob/main/docs/build.md) maybe it will help. Write what you find here!

### Clean your env

You may try to clean everything but this should be exceptional after failed local experimentations. You should never need this after a pull for example.

1- `yarn cache clean && rm -rf node_modules ios android .expo`
2- Look for the deleted `ci_post_clone.sh` in your local change and revert it. (put back the file)

## w2-api Integration with w2-client

### **Overview**

The `w2-api` is a local module designed for integration with `w2-client`. It has been configured to support auto-compilation, which provides flexibility during development.

### **Compilation Modes**

1. **Post-install Compilation**:
    - When not developing backend, the `.js` files of `w2-api` are compiled during the post-install step.

2. **Live Compilation with w2-dev**:
    - When developing backend, you want to run it from `w2-dev`, using `npm start`. While running with `w2-dev live`, there's a `nodemon` setup to compile the files in real-time.

### **Module Inclusion and Packaging**

- The `w2-api` module is not directly included as a traditional module. Instead, it's referenced as an extra source path to support live reloads directly from the source code.
- This referencing is facilitated by aliases set in the `./tsconfig.json`.
- However, for the module to be effectively used across platforms, configurations have been made in both `babel` (for the web) and `metro` (for iOS/android) to package it correctly.
  - Specific configurations can be found in `./babel.config.js` and `./metro.config.js`.
  - Metro has additional configurations to ensure the modules leveraged by `w2-api` are resolved within its own module set.

### **Additional Resources**

- For deeper insights on importing files from directories outside the root with React Native's Metro bundler, refer to this [medium article](https://dushyant37.medium.com/how-to-import-files-from-outside-of-root-directory-with-react-native-metro-bundler-18207a348427).
- More about the Babel plugin module resolver can be found on its [npm page](https://www.npmjs.com/package/babel-plugin-module-resolver).
