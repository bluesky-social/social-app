#!/bin/sh
# The number here should always be the line number the iOS build variable is on
line=$(sed "30q;d" ./app.config.js)
currentBuildNumber=$(echo "$line" | grep -oE '[0-9]+([.][0-9]+)?')
newBuildNumber=$((currentBuildNumber+1))
newBuildVariable="const ANDROID_VERSION_CODE = '$newBuildNumber'"
sed -i.bak "30s/.*/  $newBuildVariable/" ./app.config.js
rm -rf ./app.config.js.bak

echo "Android build number bumped to $newBuildNumber"
