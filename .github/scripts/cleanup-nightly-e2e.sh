#!/usr/bin/env bash

set +e

platform="${1:?usage: cleanup-nightly-e2e.sh <ios|android> <device-id>}"
device_id="${2:-}"
artifact_dir="${GITHUB_WORKSPACE:-$PWD}/artifacts/$platform"
mkdir -p "$artifact_dir"

if [[ -f i18n.log ]]; then
  cp i18n.log "$artifact_dir/i18n.log"
fi

stop_process_tree() {
  local pid="$1"
  local child
  while read -r child; do
    [[ -n "$child" ]] && stop_process_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)
  kill -TERM "$pid" >/dev/null 2>&1 || true
}

stop_pid_file() {
  [[ -f "$1" ]] || return 0
  local pid
  pid="$(cat "$1")"
  stop_process_tree "$pid"
}

stop_pid_file "$artifact_dir/metro.pid"
stop_pid_file "$artifact_dir/mock-server.pid"
stop_pid_file "$artifact_dir/emulator.pid"

if [[ "$platform" == "ios" ]]; then
  if [[ -f "$artifact_dir/redis-bin.txt" ]]; then
    "$(cat "$artifact_dir/redis-bin.txt")/redis-cli" \
      -h 127.0.0.1 -p 6380 shutdown nosave >/dev/null 2>&1 || true
  fi
  if [[ -f "$artifact_dir/postgres-bin.txt" ]]; then
    "$(cat "$artifact_dir/postgres-bin.txt")/pg_ctl" \
      -D "${RUNNER_TEMP:-/tmp}/nightly-e2e-postgres" -m fast stop >/dev/null 2>&1 || true
  fi
  [[ -n "$device_id" ]] && xcrun simctl shutdown "$device_id" >/dev/null 2>&1 || true
else
  docker compose -f dev-env/dev-infra/docker-compose.yaml logs --no-color \
    >>"$artifact_dir/docker-services.log" 2>&1 || true
  docker compose -f dev-env/dev-infra/docker-compose.yaml down --volumes --remove-orphans >/dev/null 2>&1 || true
  [[ -n "$device_id" ]] && adb -s "$device_id" emu kill >/dev/null 2>&1 || true
fi
