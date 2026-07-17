#!/usr/bin/env bash

set -Eeuo pipefail

platform="${1:?usage: run-nightly-e2e.sh <ios|android> <device-id>}"
device_id="${2:?usage: run-nightly-e2e.sh <ios|android> <device-id>}"

if [[ "$platform" != "ios" && "$platform" != "android" ]]; then
  echo "Unsupported platform: $platform" >&2
  exit 2
fi

artifact_dir="${GITHUB_WORKSPACE:-$PWD}/artifacts/$platform"
maestro_dir="$artifact_dir/maestro"
mkdir -p "$maestro_dir"

phase() {
  printf '%s\n' "$1" >"$artifact_dir/phase.txt"
}

wait_for_port() {
  local port="$1"
  local label="$2"
  local attempts="${3:-120}"

  for ((i = 1; i <= attempts; i++)); do
    if nc -z 127.0.0.1 "$port" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for $label on port $port" >&2
  return 1
}

# shellcheck disable=SC2329 # Invoked through the cleanup trap call chain.
stop_process_tree() {
  local pid="$1"
  local child
  while read -r child; do
    [[ -n "$child" ]] && stop_process_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)
  kill -TERM "$pid" >/dev/null 2>&1 || true
}

# shellcheck disable=SC2329 # Invoked by cleanup, which is registered as a trap.
stop_pid_file() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 0

  local pid
  pid="$(cat "$pid_file")"
  [[ -n "$pid" ]] || return 0

  # pnpm and Expo both spawn multiple generations of children.
  stop_process_tree "$pid"
}

# shellcheck disable=SC2329 # Invoked by the EXIT/INT/TERM trap below.
cleanup() {
  set +e
  stop_pid_file "$artifact_dir/metro.pid"
  stop_pid_file "$artifact_dir/mock-server.pid"

  if [[ "$platform" == "ios" ]]; then
    if [[ -f "$artifact_dir/redis.pid" ]]; then
      redis_bin="$(cat "$artifact_dir/redis-bin.txt")"
      "$redis_bin/redis-cli" -h 127.0.0.1 -p 6380 shutdown nosave >/dev/null 2>&1 || true
    fi
    if [[ -f "$artifact_dir/postgres-bin.txt" && -d "${RUNNER_TEMP:-/tmp}/nightly-e2e-postgres" ]]; then
      postgres_bin="$(cat "$artifact_dir/postgres-bin.txt")"
      "$postgres_bin/pg_ctl" -D "${RUNNER_TEMP:-/tmp}/nightly-e2e-postgres" -m fast stop >/dev/null 2>&1 || true
    fi
  else
    docker compose -f dev-env/dev-infra/docker-compose.yaml logs --no-color \
      >>"$artifact_dir/docker-services.log" 2>&1 || true
    docker compose -f dev-env/dev-infra/docker-compose.yaml down --volumes --remove-orphans >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

phase "Starting PostgreSQL, Redis, and mock server"
if [[ "$platform" == "ios" ]]; then
  brew install postgresql@14 2>&1 | tee "$artifact_dir/native-dependencies.log"

  postgres_bin="$(brew --prefix postgresql@14)/bin"
  redis_version="7.4.7"
  redis_archive="${RUNNER_TEMP:-/tmp}/redis-${redis_version}.tar.gz"
  redis_source="${RUNNER_TEMP:-/tmp}/redis-${redis_version}"
  curl -fsSL -o "$redis_archive" \
    "https://download.redis.io/releases/redis-${redis_version}.tar.gz"
  echo "c97e57b0df330a9e091cacff012bebe763c275398cf36ff44cdba876814b595b  $redis_archive" \
    | shasum -a 256 --check | tee -a "$artifact_dir/native-dependencies.log"
  rm -rf "$redis_source"
  tar -xzf "$redis_archive" -C "${RUNNER_TEMP:-/tmp}"
  make -C "$redis_source" -j "$(sysctl -n hw.ncpu)" \
    2>&1 | tee -a "$artifact_dir/native-dependencies.log"
  redis_bin="$redis_source/src"
  "$redis_bin/redis-server" --version | tee -a "$artifact_dir/native-dependencies.log"
  printf '%s\n' "$redis_bin" >"$artifact_dir/redis-bin.txt"

  postgres_data="${RUNNER_TEMP:-/tmp}/nightly-e2e-postgres"
  rm -rf "$postgres_data"
  "$postgres_bin/initdb" -D "$postgres_data" --auth=trust --username=pg --no-locale \
    >"$artifact_dir/postgres-init.log" 2>&1
  "$postgres_bin/pg_ctl" -D "$postgres_data" \
    -o "-p 5433 -h 127.0.0.1" -l "$artifact_dir/postgres.log" start
  printf '%s\n' "$postgres_bin" >"$artifact_dir/postgres-bin.txt"

  "$redis_bin/redis-server" \
    --bind 127.0.0.1 \
    --port 6380 \
    --save "" \
    --appendonly no \
    --daemonize yes \
    --pidfile "$artifact_dir/redis.pid" \
    --logfile "$artifact_dir/redis.log"

  wait_for_port 5433 "PostgreSQL"
  wait_for_port 6380 "Redis"
  pnpm --dir dev-env start:external >"$artifact_dir/mock-server.log" 2>&1 &
else
  pnpm --dir dev-env start >"$artifact_dir/mock-server.log" 2>&1 &
fi
printf '%s\n' "$!" >"$artifact_dir/mock-server.pid"
wait_for_port 1986 "the E2E mock-server manager"

phase "Starting Metro"
EXPO_PUBLIC_ENV=e2e \
  NODE_ENV=test \
  RN_SRC_EXT=e2e.ts,e2e.tsx \
  pnpm exec expo start --dev-client --clear --port 8081 \
  >"$artifact_dir/metro.log" 2>&1 &
printf '%s\n' "$!" >"$artifact_dir/metro.pid"
wait_for_port 8081 "Metro"

if [[ "$platform" == "android" ]]; then
  phase "Configuring Android localhost routing"
  adb -s "$device_id" reverse tcp:3000 tcp:3000
  adb -s "$device_id" reverse tcp:8081 tcp:8081
fi

phase "Building and installing the development client"
if [[ "$platform" == "ios" ]]; then
  # Passing --device makes this Expo version merge simulator and devicectl
  # results. On Xcode 26.4, devicectl can misclassify the simulator as a
  # physical device and incorrectly require signing. Exactly one simulator is
  # booted above, so Expo's default simulator-only resolver selects it.
  echo "Building for already booted iOS simulator $device_id"
  EXPO_PUBLIC_ENV=e2e \
    NODE_ENV=test \
    RN_SRC_EXT=e2e.ts,e2e.tsx \
    pnpm exec expo run:ios --no-bundler \
    2>&1 | tee "$artifact_dir/build.log"
else
  expo_device_name="$(adb -s "$device_id" emu avd name | sed -n '1p' | tr -d '\r')"
  if [[ -z "$expo_device_name" ]]; then
    echo "Could not resolve the AVD name for $device_id" >&2
    exit 1
  fi
  echo "Building for Android AVD $expo_device_name ($device_id)"
  EXPO_PUBLIC_ENV=e2e \
    NODE_ENV=test \
    RN_SRC_EXT=e2e.ts,e2e.tsx \
    pnpm exec expo run:android --device "$expo_device_name" --no-bundler \
    2>&1 | tee "$artifact_dir/build.log"
fi

phase "Running Maestro flows"
set +e
maestro test \
  --udid "$device_id" \
  --format JUNIT \
  --output "$artifact_dir/report.xml" \
  --config __e2e__/config.yml \
  --debug-output "$maestro_dir" \
  --test-output-dir "$maestro_dir" \
  --flatten-debug-output \
  __e2e__ \
  2>&1 | tee "$artifact_dir/maestro-cli.log"
maestro_status=${PIPESTATUS[0]}
set -e

if [[ "$maestro_status" -eq 0 ]]; then
  phase "Completed"
else
  phase "Maestro flow failure"
fi

exit "$maestro_status"
