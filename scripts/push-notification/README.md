# push-notification

Sends sample APNS payloads to a booted iOS simulator via `xcrun simctl push`.
Useful for exercising `useNotificationsHandler` (`src/lib/hooks/useNotificationHandler.ts`)
without a real APNS round-trip — foreground display behavior, tap responses,
and notification-driven navigation.

## What this does and doesn't cover

**Covers** — anything in `useNotificationsHandler`:

- `setNotificationHandler` foreground behavior (banner, list, badge, sound flags)
- `addNotificationResponseReceivedListener` tap handling
- Account-switch flow when `recipientDid` differs from the signed-in account
- Navigation routing for each `reason` (post threads, profiles, conversations)

**Does not cover** — `BlueskyNSE` (the iOS Notification Service Extension):

- Communication Notification styling for chat messages
- Badge increment via `mutateWithBadge`
- Custom `dm.aiff` sound for chat messages

The simulator does not reliably invoke NSEs for `simctl push` on recent iOS
versions (verified bypassed on iOS 26.4). To test NSE behavior, run on a real
device with a real APNS push, or unit-test `NotificationService.didReceive`
directly in Xcode.

## Setup

1. Boot an iOS simulator and install the app:
   ```
   yarn ios
   ```
2. Sign in to the account you'll be testing against. The `recipientDid` in
   each payload is substituted at send time and must match the signed-in DID,
   otherwise:
   - Chat notifications trigger the account-switch flow
   - Other reasons are silently dropped by the handler
3. Find your DID. Easiest: visit your profile in a web browser and copy it
   from the URL, or grep dev logs for `currentAccount`.

## Usage

```
./send.sh <payload-name> [--did <did>] [--device <udid>] [--bundle <id>]
```

Pass the DID once via env var to avoid repeating it:

```
export BLUESKY_TEST_DID=did:plc:yourdidhere

./send.sh like
./send.sh chat-message
./send.sh follow
```

Defaults: `--device booted`, `--bundle xyz.blueskyweb.app`. Run `./send.sh --help`
for the full list of available payloads.

## Foreground vs background

`useNotificationsHandler` behaves differently depending on app state:

- **Foreground** — `setNotificationHandler.handleNotification` decides whether
  to show a banner, play a sound, etc. For chat reasons, the banner is
  suppressed if `payload.convoId === currentConvoId` (you're already viewing
  that conversation).
- **Background or tapped** — `addNotificationResponseReceivedListener` fires
  on tap and runs the navigation routing in `notificationToURL`.

To test the response listener, background the app first (`cmd+shift+H` in the
sim), send the push, then tap the banner.

## Available payloads

| Payload | Reason | Navigation target |
|---|---|---|
| `like.apns` | `like` | post thread (from `subject`) |
| `reply.apns` | `reply` | post thread (from `uri`) |
| `follow.apns` | `follow` | sender's profile (from `uri.host`) |
| `chat-message.apns` | `chat-message` | `MessagesConversation` with `convoId` |
| `chat-reaction.apns` | `chat-reaction` | `MessagesConversation` with `convoId` |

The `subject` AT URIs reference fake post rkeys, so the destination screens
will fail to load real content — that's expected. Routing exercises the
navigation path, not the data fetch.

## Adding a new payload

1. Copy an existing `.apns` file in `payloads/` whose shape matches.
2. Set `aps.mutable-content: 1` and a real `aps.alert.{title,body}`.
3. Match the payload shape to `NotificationPayload` in
   `src/lib/hooks/useNotificationHandler.ts` for the `reason` you're testing.
4. Use `__RECIPIENT_DID__` as the placeholder for the recipient — `send.sh`
   substitutes it at send time. Use it anywhere a DID needs to belong to the
   logged-in user (typically `recipientDid`, and post `subject` for likes/replies).
