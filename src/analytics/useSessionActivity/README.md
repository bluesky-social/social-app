# Web analytics session activity

`App.web.tsx` mounts `useSessionActivity()` once, above account remounts and
nested analytics contexts. The default hook mounted by `App.tsx` is a no-op.
Native keeps its module-level boot/AppState policy, five-minute TTL, and
MMKV-invalidated raw-read cache.

## Activity and ordering

- Only a visible, focused document records input or history traversal. Both
  focus and visibility notifications check that gate, in either order. Duplicate
  return notifications reuse the renewed ID. Returns do not require a prior
  departure notification (it might not have been delivered before suspension).
  Blur, hidden and pagehide do not write anything. Pageshow handles a return
  from the back/forward cache.
- Window capture listeners run before React handlers and document listeners.
  Expiry (at least 30 minutes) is checked before renewal, and any new ID is
  persisted synchronously, so the triggering interaction gets the new ID.
- Trusted keydown, pointerdown, and scroll events count, including scrolls in
  nested containers. No preceding input is required for a scroll. Programmatic
  scrolling also counts while the document is visible and focused; distinguishing
  it from user scrolling is intentionally outside this policy.
- Popstate covers browser back/forward. Ordinary in-app navigation follows
  pointer/keyboard input. `Navigation.tsx` also reports initial navigation,
  redirects and restoration, so its `router:navigate` metrics intentionally do
  not count. There is no history monkey patch. A script-triggered history
  traversal cannot be distinguished from browser traversal by popstate alone.

## Shared storage

Web always reads the shared raw record. Only parsing/validation is cached, keyed
by the entire raw string. It never holds a per-tab current-ID cache.

Both platforms use the existing `lastEventAt` field: native writes lifecycle
events, while web writes only qualifying activity. Existing records work without
a migration or a second timestamp field. Missing/nonfinite timestamps retain
the ID and establish a clock on first activity. Finite old timestamps expire
normally. A future timestamp (clock rollback) is rebased on activity without
rotating. Old app bundles still running the lifecycle-based writer are not made
activity-aware by this change.

Passive reads recover missing/corrupt records, but do not rotate valid records
or give newly recovered web records an activity timestamp. Metrics, logs,
feature evaluations, uploads, flushes, and retries are not activity sources.
Already-captured metadata is never rewritten.

The hook keeps a separate in-memory timestamp for its last recording. Events
within five seconds of that time are skipped before any storage access. When
the throttle opens, the recorder reads the shared record, checks expiry, then
updates `lastEventAt` and writes synchronously. Clock rollback bypasses the
local throttle. The throttle resets when the observer remounts.

This limit is per mounted tab, not global across tabs. It throttles activity
reads and writes, not `getSessionId()`: metrics and logs still read through to
adopt another tab's current ID immediately, even during the throttle window.

There is no cached session ID, pending activity, delayed flush, timer, or
heartbeat. A fresh record object avoids mutating the cached validation result.
The first event after a long idle still publishes a new ID before its metric
metadata is captured.

The timestamp can lag actual activity by less than five seconds. A return near
the TTL boundary can therefore rotate that much early relative to the last
unpersisted event. Tests cover this explicit precision tradeoff.

LocalStorage read-modify-write is **not atomic** across tabs. Truly simultaneous
writers can race, including creating competing IDs at expiry; subsequent reads
adopt the last shared write. No cross-tab lock/leader/heartbeat is introduced.

Development diagnostics report creation, rotation, and mount/return decisions,
not individual high-frequency inputs. Every line starts with the ID's last eight
characters and contains only a source category, decision, and elapsed time.

## Verification

- `activity.test.ts`: storage read-through, record compatibility/recovery, timestamps,
  exact TTL boundaries, uninterrupted activity, suspended timers, cross-tab
  updates and diagnostics.
- `useSessionActivity.test.ts`: controlled focus/visibility in a separate JSDOM,
  capture ordering, nested scrolling without prior input, synthetic event rejection,
  local five-second read/write throttling, boundary precision, cross-tab ID adoption,
  cleanup/remount, page-cache return and the native no-op. The test harness marks
  selected synthetic inputs as trusted; these are not real browser-input tests.
- `../index.test.tsx`: actual metadata snapshots, passive logging/evaluations,
  batching/retries and activity rotation. Existing native lifecycle/storage tests
  remain in `../identifiers/`.

Real browser tab switching, visible-but-unfocused windows, composer typing,
feed scrolling, and real device sleep/wake still need manual verification.
Controlled wall-clock tests are not evidence of actual sleep/wake behavior.
