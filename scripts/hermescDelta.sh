#!/bin/bash
set -o nounset
set -o pipefail

# hermesc wrapper that compiles in Hermes delta mode. exportUpdate.sh links it
# in as <dir>/build/bin/hermesc and points REACT_NATIVE_OVERRIDE_HERMES_DIR at
# <dir>, which is how expo export finds hermesc. Expo's hermesc arguments are
# fixed, so this is the only way to add -base-bytecode.
#
# -base-bytecode makes hermesc keep the base's string table and literal
# buffers, so string IDs don't shift between builds and bsdiff patches against
# the base stay small. The output is still a complete bundle.
#
# Expects:
#   HERMESC_REAL              the hermesc to run
#   HERMES_BASE_BYTECODE      base .hbc; unset or empty means a normal compile
#   HERMES_DELTA_STATUS_FILE  optional; gets one line per compile, starting
#                             with "delta" or "fallback". Expo hides hermesc's
#                             output unless it fails, so the caller reports it.
#
# An unusable base never fails the compile: it falls back to a normal one.

real=${HERMESC_REAL:?HERMESC_REAL must point at the real hermesc}
base=${HERMES_BASE_BYTECODE:-}
status_file=${HERMES_DELTA_STATUS_FILE:-/dev/null}

compiling=false
for arg in "$@"; do
  if [ "$arg" = "-emit-binary" ]; then
    compiling=true
  fi
done

if [ -z "$base" ] || [ "$compiling" != true ]; then
  exec "$real" "$@"
fi

# usage: fallback <reason> <hermesc args...>
fallback() {
  local reason=$1
  shift
  echo "fallback: $reason" >> "$status_file"
  echo "hermescDelta: $reason, compiling without a base" >&2
  exec "$real" "$@"
}

# A .hbc file starts with an 8-byte magic, then a little-endian uint32
# bytecode version. hermesc rejects a base from a different version.
if [ ! -f "$base" ]; then
  fallback "base $base does not exist" "$@"
fi
magic=$(od -An -tx1 -N8 "$base" | tr -d ' \n')
if [ "$magic" != "c61fbc03c103191f" ]; then
  fallback "base $base is not Hermes bytecode" "$@"
fi
read -r b0 b1 b2 b3 < <(od -An -tu1 -j8 -N4 "$base")
base_version=$((b0 | b1 << 8 | b2 << 16 | b3 << 24))
hermesc_version=$("$real" -version | sed -n 's/.*HBC bytecode version: *\([0-9][0-9]*\).*/\1/p')
if [ "$base_version" != "$hermesc_version" ]; then
  fallback "base $base is bytecode version $base_version but hermesc emits ${hermesc_version:-an unknown version}" "$@"
fi

if "$real" "$@" "-base-bytecode=$base"; then
  echo "delta: compiled against $base (bytecode version $base_version)" >> "$status_file"
  exit 0
fi
fallback "hermesc failed with -base-bytecode=$base" "$@"
