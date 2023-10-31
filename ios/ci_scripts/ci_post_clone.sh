#!/bin/sh

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export CI=true

# to the project root
cd ../..
echo "Running in..."
pwd

brew install node@18
brew link node@18

brew install yarn

echo "yarn install..."
yarn install --frozen-lockfile

echo "expo prebuild..."
npx expo prebuild

# Note: .env not used for xcode cloud
#       SENTRY_AUTH_TOKEN directly in Xcode cloud secret on apple connect
# yarn env
