#!/bin/sh
# The number here should always be the line number the iOS build variable is on
line=$(sed "24q;d" ./app.config.js)
currentBuildNumber=$(echo "$line" | grep -oE '[0-9]+([.][0-9]+)?')
newBuildNumber=$((currentBuildNumber+1))
newBuildVariable="const IOS_BUILD_NUMBER = '$newBuildNumber'"
sed -i.bak "24s/.*/  $newBuildVariable/" ./app.config.js
rm -rf ./app.config.js.bak

echo "iOS build number bumped to $newBuildNumber"
