#!/bin/bash

rm -rf bundleTempDir
rm -rf bundle.tar.gz

node scripts/bundleUpdate.js

cd bundleTempDir || exit

RUNTIME_VERSION=$(cat metadata.json | jq -r '.runtimeVersion')

tar czvf bundle.tar.gz ./*

curl --form 'bundle=@./bundle.tar.gz' \
--user bsky:abc \
--basic "http://localhost:12345/v1/upload?runtime-version=$RUNTIME_VERSION&bundle-version=12345678" \
/

cd ..

rm -rf bundleTempDir
rm -rf bundle.tar.gz
