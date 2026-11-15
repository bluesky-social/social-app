#!/usr/bin/env bash
set -euo pipefail

# Sends a sample APNS payload to a booted iOS simulator. Useful for testing
# BlueskyNSE and useNotificationsHandler without a real APNS round-trip.
#
# Usage:
#   scripts/push-test/send.sh <payload-name> [--did <did>] [--device <udid>] [--bundle <id>]
#
# Examples:
#   scripts/push-test/send.sh like --did did:plc:abc123
#   BLUESKY_TEST_DID=did:plc:abc123 scripts/push-test/send.sh chat-message

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD_DIR="$SCRIPT_DIR/payloads"

device="booted"
bundle="xyz.blueskyweb.app"
did="${BLUESKY_TEST_DID:-}"
name=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --did) did="$2"; shift 2;;
    --device) device="$2"; shift 2;;
    --bundle) bundle="$2"; shift 2;;
    -h|--help)
      cat <<EOF
Usage: $0 <payload-name> [--did <did>] [--device <udid>] [--bundle <id>]

Available payloads:
$(ls "$PAYLOAD_DIR" 2>/dev/null | sed 's/\.apns$//' | sed 's/^/  /')

Pass --did or set BLUESKY_TEST_DID to substitute the recipient DID. The DID
must match the account currently signed in to the app, otherwise chat
notifications will trigger an account-switch flow and other reasons will be
silently dropped by the handler.
EOF
      exit 0
      ;;
    *)
      if [[ -z "$name" ]]; then
        name="$1"
      else
        echo "Unknown arg: $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [[ -z "$name" ]]; then
  echo "Error: payload name required. Run with --help for options." >&2
  exit 1
fi

src="$PAYLOAD_DIR/${name}.apns"
if [[ ! -f "$src" ]]; then
  echo "Error: payload not found: $src" >&2
  echo "Available:" >&2
  ls "$PAYLOAD_DIR" | sed 's/\.apns$//' | sed 's/^/  /' >&2
  exit 1
fi

if [[ -z "$did" ]]; then
  echo "Error: missing recipient DID. Pass --did or set BLUESKY_TEST_DID." >&2
  echo "       The DID must match the account currently signed in to the app." >&2
  exit 1
fi

tmp="$(mktemp -t bluesky-push.XXXXXX).apns"
trap 'rm -f "$tmp"' EXIT
sed "s|__RECIPIENT_DID__|$did|g" "$src" > "$tmp"

echo "Pushing '$name' to $device ($bundle)"
xcrun simctl push "$device" "$bundle" "$tmp"
echo "Delivered."
