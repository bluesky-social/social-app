#!/usr/bin/env bash

mkdir ./bin
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ./bin --tag 1.40.0
export PATH="$PATH:$(pwd)/.bin"

./bin/just dist-build-web
