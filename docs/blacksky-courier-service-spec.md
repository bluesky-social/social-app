# Blacksky Courier Service Spec

This document specifies a standalone courier service compatible with the
`courier.Service` Connect RPC client used by Blacksky AppView. The courier
service is separate from AppView. AppView remains the authenticated XRPC entry
point for `app.bsky.notification.*`; courier owns device token persistence,
APNs/FCM dispatch, delivery logging, invalid-token cleanup, and retry behavior.

## Integration Points

AppView configuration:

```sh
BSKY_COURIER_URL=https://courier.blacksky.community
BSKY_COURIER_API_KEY=<shared-secret>
```

Every courier request from AppView includes:

```http
Authorization: Bearer <BSKY_COURIER_API_KEY>
```

The service must reject missing or invalid bearer tokens with Connect
`Unauthenticated`.

The Blacksky AppView DID document must advertise the notification service:

```json
{
  "id": "#bsky_notif",
  "type": "BskyNotificationService",
  "serviceEndpoint": "https://api.blacksky.community"
}
```

The mobile app registers push tokens by calling AppView XRPC
`app.bsky.notification.registerPush`. AppView validates auth and forwards to
courier `RegisterDeviceToken`.

## Protocol

Protocol: Connect RPC over HTTP/2 or HTTP/1.1.

All methods are unary.

Connect HTTP paths:

```txt
POST /courier.Service/Ping
POST /courier.Service/PushNotifications
POST /courier.Service/RegisterDeviceToken
POST /courier.Service/UnregisterDeviceToken
POST /courier.Service/SetAgeRestricted
```

Reconstructed protobuf contract:

```proto
syntax = "proto3";

package courier;

import "google/protobuf/struct.proto";
import "google/protobuf/timestamp.proto";

service Service {
  rpc Ping(PingRequest) returns (PingResponse);
  rpc PushNotifications(PushNotificationsRequest) returns (PushNotificationsResponse);
  rpc RegisterDeviceToken(RegisterDeviceTokenRequest) returns (RegisterDeviceTokenResponse);
  rpc UnregisterDeviceToken(UnregisterDeviceTokenRequest) returns (UnregisterDeviceTokenResponse);
  rpc SetAgeRestricted(SetAgeRestrictedRequest) returns (SetAgeRestrictedResponse);
}

enum AppPlatform {
  APP_PLATFORM_UNSPECIFIED = 0;
  APP_PLATFORM_IOS = 1;
  APP_PLATFORM_ANDROID = 2;
  APP_PLATFORM_WEB = 3;
}

message PingRequest {}
message PingResponse {}

message Notification {
  string id = 1;
  string recipient_did = 2;
  string title = 3;
  string message = 4;
  string collapse_key = 5;
  bool always_deliver = 6;
  google.protobuf.Timestamp timestamp = 7;
  google.protobuf.Struct additional = 8;
  bool client_controlled = 9;
}

message PushNotificationsRequest {
  repeated Notification notifications = 1;
}
message PushNotificationsResponse {}

message RegisterDeviceTokenRequest {
  string did = 1;
  string token = 2;
  string app_id = 3;
  AppPlatform platform = 4;
  bool age_restricted = 5;
}
message RegisterDeviceTokenResponse {}

message UnregisterDeviceTokenRequest {
  string did = 1;
  string token = 2;
  string app_id = 3;
  AppPlatform platform = 4;
}
message UnregisterDeviceTokenResponse {}

message SetAgeRestrictedRequest {
  string did = 1;
  bool age_restricted = 2;
}
message SetAgeRestrictedResponse {}
```

Platform mapping:

```txt
APP_PLATFORM_IOS -> ios
APP_PLATFORM_ANDROID -> android
APP_PLATFORM_WEB -> web
APP_PLATFORM_UNSPECIFIED -> invalid
```

For Blacksky mobile, `app_id` must be `community.blacksky.app`.

## Ping

Purpose: report whether courier can accept requests.

Request:

```json
{}
```

Response:

```json
{}
```

Behavior:

- Authenticate the request.
- Check database connectivity.
- Return success if the service can accept token registration and delivery jobs.
- Do not perform live APNs/FCM sends in the hot health path.
- If provider credential validation is implemented, make it cached and expose it
  through internal metrics rather than making `Ping` slow or flaky.

Failure handling:

- Bad auth: `Unauthenticated`.
- DB unavailable: `Unavailable`.
- Missing required runtime config: `FailedPrecondition`.

## RegisterDeviceToken

Purpose: store or reactivate a push token for a DID/app/platform.

Request:

```ts
type RegisterDeviceTokenRequest = {
  did: string
  token: string
  appId: string
  platform: AppPlatform
  ageRestricted: boolean
}
```

Validation:

- `did` is required.
- `token` is required.
- `appId` is required.
- `platform` must be iOS, Android, or web.
- `APP_PLATFORM_UNSPECIFIED` is invalid.

Behavior:

- Upsert by `(did, app_id, platform, token)`.
- Registration must be idempotent.
- If an existing token was disabled, clear `disabled_at`.
- Store `age_restricted`.
- Update `last_registered_at` and `updated_at`.
- Return an empty response.

Suggested SQL:

```sql
create table device_tokens (
  did text not null,
  app_id text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  token text not null,
  age_restricted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_registered_at timestamptz not null default now(),
  disabled_at timestamptz,
  invalidated_at timestamptz,
  invalidation_reason text,
  primary key (did, app_id, platform, token)
);

create index device_tokens_did_active_idx
  on device_tokens (did)
  where disabled_at is null and invalidated_at is null;
```

Failure handling:

- Validation failure: `InvalidArgument`.
- DB write failure: `Unavailable` for transient failures, `Internal` for
  unexpected non-transient failures.
- Duplicate registration: success.

## UnregisterDeviceToken

Purpose: disable a push token when the app logs out or removes an account.

Request:

```ts
type UnregisterDeviceTokenRequest = {
  did: string
  token: string
  appId: string
  platform: AppPlatform
}
```

Behavior:

- Validate the same required fields as registration.
- Soft-disable the matching token by setting `disabled_at`.
- Missing tokens must still return success.
- Do not disable other DIDs that happen to share the same raw token.

Failure handling:

- Validation failure: `InvalidArgument`.
- Missing token: success.
- DB failure: `Unavailable` or `Internal`.

## SetAgeRestricted

Purpose: update the age-restricted state for all tokens owned by a DID.

Request:

```ts
type SetAgeRestrictedRequest = {
  did: string
  ageRestricted: boolean
}
```

Behavior:

- Validate `did`.
- Update every active token for the DID.
- Return success if the DID has no tokens.
- Use this flag during delivery to suppress or sanitize notifications whose
  visible content should not be sent to age-restricted users.

Failure handling:

- Missing DID: `InvalidArgument`.
- DB failure: `Unavailable` or `Internal`.

## PushNotifications

Purpose: deliver one or more notifications to active tokens for each
notification's `recipient_did`.

Request:

```ts
type PushNotificationsRequest = {
  notifications: Notification[]
}

type Notification = {
  id: string
  recipientDid: string
  title: string
  message: string
  collapseKey: string
  alwaysDeliver: boolean
  timestamp?: Date
  additional?: Record<string, unknown>
  clientControlled: boolean
}
```

Validation:

- `notifications` can be empty; empty batch returns success.
- Each notification must have `id`.
- Each notification must have `recipientDid`.
- Visible notifications should have `title` and `message`.
- Mobile-handled notifications must have `additional.reason`.
- `additional` must be JSON-compatible and should only contain scalar values or
  simple nested data that providers can encode.

Behavior:

1. Authenticate.
2. Validate the batch.
3. Deduplicate by `notification.id`.
4. Persist an incoming notification record or enqueue a delivery job before
   talking to APNs/FCM.
5. Load active tokens for `recipientDid`.
6. Apply delivery policy:
   - `alwaysDeliver === true`: send even when normal preference filtering would
     suppress.
   - `clientControlled === true`: send a data/control payload; it may not
     display a visible alert.
   - Otherwise apply app notification preferences and age-restriction policy.
7. Send to APNs for iOS tokens and FCM for Android tokens.
8. Record one delivery attempt per `(notification_id, token)`.
9. Disable tokens reported as unregistered/invalid by the provider.
10. Return success after the batch is accepted and attempts have been made or
    durably queued.

Suggested delivery tables:

```sql
create table notification_jobs (
  id text primary key,
  recipient_did text not null,
  title text,
  message text,
  collapse_key text,
  always_deliver boolean not null default false,
  client_controlled boolean not null default false,
  additional jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  status text not null default 'pending'
);

create table notification_delivery_attempts (
  notification_id text not null,
  did text not null,
  app_id text not null,
  platform text not null,
  token_hash text not null,
  status text not null,
  provider_message_id text,
  error_code text,
  error_message text,
  attempted_at timestamptz not null default now(),
  primary key (notification_id, token_hash)
);
```

Store a token hash in logs and attempt tables unless full tokens are required
for operational debugging.

Failure handling:

- Validation failure for any notification: `InvalidArgument`.
- If the batch cannot be persisted or queued: `Unavailable` or `Internal`.
- Provider failures should not usually fail the whole RPC after the job is
  persisted. Record per-token failures and retry where appropriate.
- If a notification has no active tokens, record that state and return success.

## Mobile Payload Contract

Courier should copy `notification.additional` into APNs custom payload fields and
FCM `data` fields. The app's notification handler expects these shapes.

Activity payload:

```ts
type ActivityPayload = {
  reason:
    | 'like'
    | 'repost'
    | 'follow'
    | 'mention'
    | 'reply'
    | 'quote'
    | 'starterpack-joined'
    | 'like-via-repost'
    | 'repost-via-repost'
    | 'verified'
    | 'unverified'
    | 'subscribed-post'
  uri: string
  subject: string
  recipientDid: string
}
```

Chat payload:

```ts
type ChatPayload = {
  reason: 'chat-message' | 'chat-reaction'
  convoId: string
  messageId: string
  recipientDid: string
  senderDisplayName?: string
  senderHandle?: string
  senderAvatarUrl?: string
}
```

Control payload:

```ts
type ControlPayload = {
  reason: 'mark-read-generic'
}
```

## iOS APNs Delivery

Runtime config:

```sh
APNS_TEAM_ID=<apple-team-id>
APNS_KEY_ID=<apns-key-id>
APNS_PRIVATE_KEY_PATH=/run/secrets/apns-auth-key.p8
APNS_TOPIC=community.blacksky.app
APNS_ENV=production
```

APNs payload requirements:

- Topic: `community.blacksky.app`.
- Include `mutable-content: 1` so `BlackskyNSE` can mutate badge and chat sound.
- Copy `additional` fields to the top level of the APNs payload, because the
  iOS app and NSE inspect top-level `userInfo` keys.
- For visible pushes, include `aps.alert.title` and `aps.alert.body`.
- For client-controlled pushes such as `mark-read-generic`, use silent or
  low-priority data behavior if the provider library supports it.

Visible iOS payload:

```json
{
  "aps": {
    "alert": {
      "title": "Alice replied",
      "body": "Alice: see you there"
    },
    "mutable-content": 1
  },
  "reason": "reply",
  "uri": "at://did:example/app.bsky.feed.post/abc",
  "subject": "at://did:example/app.bsky.feed.post/abc",
  "recipientDid": "did:plc:recipient"
}
```

Chat iOS payload:

```json
{
  "aps": {
    "alert": {
      "title": "Alice",
      "body": "see you there"
    },
    "mutable-content": 1
  },
  "reason": "chat-message",
  "convoId": "3l...",
  "messageId": "3m...",
  "recipientDid": "did:plc:recipient",
  "senderDisplayName": "Alice",
  "senderHandle": "alice.example.com",
  "senderAvatarUrl": "https://cdn.example/avatar.jpg"
}
```

APNs failure handling:

- Invalid token or unregistered token: set `invalidated_at`, keep delivery
  attempt status `invalid_token`, do not retry.
- `BadDeviceToken`, `DeviceTokenNotForTopic`, `TopicDisallowed`: mark invalid
  or misconfigured depending on scope; alert if many tokens fail at once.
- `TooManyRequests`: retry with exponential backoff and jitter.
- `ExpiredProviderToken` or auth/key errors: provider config incident; stop
  retry storm, mark attempts as provider auth failure, alert.
- Network timeouts: retry with backoff.

## Android FCM Delivery

Runtime config:

```sh
FCM_PROJECT_ID=<firebase-project-id>
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-service-account.json
ANDROID_APP_ID=community.blacksky.app
```

Android client behavior:

- The app reads push payload data from `notification.request.content.data`.
- The native background handler routes chat notifications to Android channels
  `chat-messages` or `chat-messages-muted` based on local preferences.
- The handler routes activity notifications to reason-named channels for:
  `like`, `repost`, `follow`, `mention`, `reply`, `quote`,
  `like-via-repost`, `repost-via-repost`, and `subscribed-post`.
- `dm.mp3` is bundled in the app and used by the chat channel.

FCM payload rules:

- Use `data` for the payload fields the app needs.
- FCM `data` values must be strings. Convert booleans, numbers, and nested
  values before sending.
- Include Android notification title/body for visible notifications.
- Do not rely on courier to pick chat channels. The app's background handler
  mutates `channelId` based on `reason` and local preference.
- Set `collapseKey` when provided.

TypeScript helper for Android data conversion:

```ts
function toFcmData(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue
    out[key] =
      typeof value === 'string' ? value : JSON.stringify(value)
  }
  return out
}
```

Example FCM Admin send:

```ts
import {getMessaging} from 'firebase-admin/messaging'

type AndroidDeliveryInput = {
  token: string
  notification: {
    id: string
    title: string
    message: string
    collapseKey?: string
    additional: Record<string, unknown>
    clientControlled: boolean
  }
}

export async function sendAndroidPush(input: AndroidDeliveryInput) {
  const data = toFcmData({
    ...input.notification.additional,
    notificationId: input.notification.id,
  })

  const visible = !input.notification.clientControlled

  return getMessaging().send({
    token: input.token,
    data,
    notification: visible
      ? {
          title: input.notification.title,
          body: input.notification.message,
        }
      : undefined,
    android: {
      collapseKey: input.notification.collapseKey || undefined,
      priority: 'high',
      notification: visible
        ? {
            title: input.notification.title,
            body: input.notification.message,
            defaultSound: false,
            visibility: 'private',
          }
        : undefined,
    },
  })
}
```

Example activity FCM message:

```json
{
  "token": "<fcm-token>",
  "data": {
    "notificationId": "notif-123",
    "reason": "reply",
    "uri": "at://did:example/app.bsky.feed.post/abc",
    "subject": "at://did:example/app.bsky.feed.post/abc",
    "recipientDid": "did:plc:recipient"
  },
  "notification": {
    "title": "Alice replied",
    "body": "Alice: see you there"
  },
  "android": {
    "collapseKey": "reply:at://did:example/app.bsky.feed.post/abc",
    "priority": "high",
    "notification": {
      "visibility": "private",
      "defaultSound": false
    }
  }
}
```

Example chat FCM message:

```json
{
  "token": "<fcm-token>",
  "data": {
    "notificationId": "notif-456",
    "reason": "chat-message",
    "convoId": "3l...",
    "messageId": "3m...",
    "recipientDid": "did:plc:recipient",
    "senderDisplayName": "Alice",
    "senderHandle": "alice.example.com",
    "senderAvatarUrl": "https://cdn.example/avatar.jpg"
  },
  "notification": {
    "title": "Alice",
    "body": "see you there"
  },
  "android": {
    "collapseKey": "chat:3l...",
    "priority": "high",
    "notification": {
      "visibility": "private",
      "defaultSound": false
    }
  }
}
```

FCM failure handling:

- `messaging/registration-token-not-registered`: invalidate token, do not retry.
- `messaging/invalid-registration-token`: invalidate token, do not retry.
- `messaging/mismatched-credential`: provider config incident, alert.
- `messaging/message-rate-exceeded` or quota errors: retry with exponential
  backoff and jitter.
- Network timeout: retry.
- Payload too large: record `payload_too_large`, do not retry until payload
  construction is fixed.

## Notification Preferences

The service should respect Blacksky notification preferences. AppView stores
and exposes these preferences through `app.bsky.notification.getPreferences`
and `putPreferencesV2`; courier needs access to the effective preference state
before sending visible pushes.

Required categories:

```txt
chat
follow
like
likeViaRepost
mention
quote
reply
repost
repostViaRepost
starterpackJoined
subscribedPost
unverified
verified
```

Policy:

- If a preference's `push` is false, suppress visible push delivery for that
  reason unless `alwaysDeliver` is true.
- For filterable preferences with `include: follows`, only deliver when the
  notification actor is followed by the recipient. Courier must either receive
  that decision precomputed in `additional` or query a service/data source that
  can answer it.
- For chat with `include: accepted`, suppress chat notifications for
  unaccepted conversations. Courier must receive or query that conversation
  state.
- `clientControlled` control notifications may bypass visible-push preference
  checks if they do not display user-facing content.

Open implementation choice:

- Courier can query AppView/dataplane for preferences and relationship state.
- Or AppView can pass already-filtered notifications to courier. If choosing
  this path, document that courier trusts AppView and only enforces token,
  provider, age, and dedupe policy.

## Failure Modes and Error Handling

### Request Authentication

Failure: missing or wrong bearer token.

Response: Connect `Unauthenticated`.

Action: do not log full token. Log request path, caller IP, and auth failure
reason.

### Bad Request Shape

Failure: missing DID, token, app ID, notification ID, recipient DID, invalid
platform, non-JSON additional payload.

Response: Connect `InvalidArgument`.

Action: return a clear message; no DB writes except optional invalid request
metrics.

### Duplicate Requests

Failure: AppView retries registration or delivery after timeout.

Response: success.

Action:

- Registration upsert is idempotent.
- Unregistration of missing token is idempotent.
- Delivery dedupes by `notification.id` and per-token delivery primary key.

### Courier DB Unavailable

Failure: database connection pool exhausted, DB down, migration mismatch.

Response:

- For `RegisterDeviceToken`, `UnregisterDeviceToken`, `SetAgeRestricted`:
  Connect `Unavailable`.
- For `PushNotifications`: `Unavailable` if the batch cannot be persisted or
  queued.

Action: AppView may retry depending on caller behavior. Courier should alert on
health and error-rate thresholds.

### APNs/FCM Provider Outage

Failure: provider network unavailable or provider returns transient server
errors.

Response: if the notification job was persisted, return success and retry
asynchronously. If no durable queue exists and the request cannot be processed,
return `Unavailable`.

Action: exponential backoff with jitter, bounded retries, metrics by provider
and platform.

### Provider Credential Misconfiguration

Failure examples: expired APNs key, wrong APNs topic, Firebase service account
for the wrong project.

Response: `FailedPrecondition` for direct provider validation paths. For
`PushNotifications`, persist the job, mark attempts `provider_config_error`,
and alert.

Action: do not retry indefinitely at high rate. Use circuit breaking until
credentials are fixed.

### Invalid Device Token

Failure: APNs or FCM says token is unregistered or invalid.

Response: `PushNotifications` still succeeds for the batch if processing
continues.

Action: set `invalidated_at`, record provider error, never retry that token.

### Payload Too Large

Failure: APNs/FCM rejects the payload size.

Response: do not fail the whole batch after persistence.

Action: record `payload_too_large`, do not retry unchanged payload. Alert if
this appears for many notifications. Prefer trimming optional fields like
avatar URL before dropping the notification entirely.

### Partial Batch Failure

Failure: some tokens receive successfully and others fail.

Response: success once accepted and attempts are logged.

Action: per-token attempt records carry final status. Retry only retryable
tokens.

### No Active Tokens

Failure: recipient has no active devices.

Response: success.

Action: record `no_active_tokens` for the job or metric only.

### Age Restriction

Failure: visible notification would expose content to an age-restricted user.

Response: success with suppressed delivery.

Action: record `suppressed_age_restricted`. Consider sending only safe
client-controlled data if needed.

### Preference Suppression

Failure: user disabled push for the notification reason.

Response: success with suppressed delivery.

Action: record `suppressed_preference`; do not retry.

### AppView Timeout During Courier Call

Failure: AppView calls courier, courier succeeds, AppView times out and retries.

Response: subsequent duplicate calls return success.

Action: dedupe by registration key and notification ID.

## Retry Policy

Recommended defaults:

```txt
max attempts: 5
base delay: 1s
backoff: exponential
jitter: full jitter
max delay: 5m
dead-letter after final failure
```

Retryable:

- Provider transient 5xx.
- Network timeout.
- Rate limit/quota with retry-after.
- DB temporary unavailable before job persistence.

Not retryable:

- Invalid token.
- Token not registered.
- Invalid payload shape.
- Payload too large.
- Preference suppression.
- Age suppression.
- Provider credential mismatch until config changes.

## Observability

Metrics:

```txt
courier_rpc_requests_total{method,status}
courier_device_tokens_active{platform,app_id}
courier_push_jobs_total{reason,status}
courier_delivery_attempts_total{platform,provider,status,error_code}
courier_delivery_latency_ms{platform,provider}
courier_invalid_tokens_total{platform,provider,error_code}
courier_suppressed_total{reason,cause}
```

Logs:

- Do not log raw device tokens.
- Log DID only where necessary; prefer hashes in high-volume delivery logs.
- Include notification ID, platform, app ID, reason, provider error code, and
  retry attempt.

Alerts:

- Provider credential errors.
- Sudden invalid-token spike.
- High transient provider error rate.
- Queue depth or job age above threshold.
- DB unavailable.
- `Ping` failing.

## Minimum Viable Implementation

1. Connect server with API-key auth.
2. `Ping`.
3. `RegisterDeviceToken`.
4. `UnregisterDeviceToken`.
5. `PushNotifications` with durable job records.
6. FCM send for Android.
7. APNs send for iOS.
8. Invalid-token cleanup.
9. Per-token delivery attempt logging.
10. Basic preference and age suppression.

## Validation Checklist

- AppView starts with `BSKY_COURIER_URL` and token registration no longer
  returns "not configured to support push token registration."
- iOS registration stores `platform = ios`, `app_id = community.blacksky.app`.
- Android registration stores `platform = android`, `app_id = community.blacksky.app`.
- Test Android chat push opens the correct conversation and uses chat channel
  routing.
- Test Android reply/mention push opens the correct post.
- Test iOS chat push invokes `BlackskyNSE` and includes chat metadata.
- Test iOS activity push increments local badge through the NSE.
- Logout unregisters the token idempotently.
- Invalid APNs/FCM tokens are disabled.
- Duplicate `PushNotifications` calls do not create duplicate sends for the same
  notification/token pair.
