# Video watch feed feedback

Sends per-segment video watch time to the Bluesky feed that recommended the
post, through the existing `app.bsky.feed.sendInteractions` call. It's off by
default behind the `feed:video_watch:enable` GrowthBook flag
(`Features.FeedVideoWatchEnable`).

## Status

The client sends `app.bsky.feed.defs#interactionUnspecced` events, whose
`payload` is an open shape that only Bluesky's own feeds receive (see
`UnspeccedInteractionPayload` in `src/features/feedFeedback`). No lexicon
change is needed.

Keep the flag off until the receiving feed generator (Iris, for Discover) keeps
`interactionUnspecced` events and their `payload`, and the warehouse has
somewhere to put them. As of 2026-11-24 Iris drops both. That's Algo's work.

## Payload

```json
{
  "item": "at://did:plc:…/app.bsky.feed.post/…",
  "event": "app.bsky.feed.defs#interactionUnspecced",
  "feedContext": "…",
  "reqId": "…",
  "viewContext": "feed",
  "payload": {
    "type": "videoWatch",
    "durationMs": 4180,
    "videoDurationMs": 30033,
    "playbackSessionId": "V1StGXR8_Z5jdHi6B-myT",
    "segmentIndex": 0,
    "loop": 0,
    "muted": true,
    "fullscreen": false,
    "autoplay": true,
    "context": "embed",
    "endReason": "paused"
  }
}
```

- `item`, `feedContext` and `reqId` belong to the **recommended feed item**.
  For a quoted video that's the outer post, not the quoted one.
- `viewContext` is where it was watched: `feed`, or `thread` for the post a
  feed opened into.
- `durationMs` is the watch time in this segment only (a delta). It reuses the
  segments behind the `video:playback:duration` metric, so the clock and its
  rules (wall-clock time between advancing progress callbacks, no time while
  paused, buffering or backgrounded) are the same.
- `playbackSessionId` + `segmentIndex` identify a segment. Repeated copies of
  one segment within a batch are collapsed, and distinct segments are kept.
  Downstream should still dedupe on `(playbackSessionId, segmentIndex)` and
  sum `durationMs` per session.
- `videoDurationMs` is the authoritative length in milliseconds, or **absent**
  when unknown. Never zero or estimated. Web reads the media element's
  `duration`, the immersive feed reads expo-video's `sourceLoad` event for
  this item's own source, and native inline embeds read `duration` from
  `@bsky.app/video`'s progress event (0.5.0+). Pooled immersive players can
  miss the load event of a
  preloaded source, in which case it's omitted too.
- `loop` is which time through the video this is: 0 for the first watch, 1 for
  the second, and so on. Looping, replaying after the end and seeking back to
  the first ~1.5 seconds all start a new loop. A segment never spans two loops:
  it ends with `looped`. Many players stop for a moment at the seam (a pause on
  native, a buffering stall on web), so a pause or stall is held for up to 2
  seconds: if playback picks up from the start, the segment ends `looped`;
  otherwise it ends `paused` or `buffering` as usual.
- `muted`, `fullscreen` and `autoplay` describe the whole segment. Muting or
  unmuting ends the segment with `muteChanged`, and entering or leaving
  fullscreen ends it with `fullscreenChanged`.
  - `muted` counts zero volume as muted on web.
  - `fullscreen` is the player's own fullscreen mode. The immersive feed has
    none, so it's always false there; use `context` for that. Android shows
    fullscreen video in a separate screen that the OS reports as the app
    being in the background, so the embed keeps counting while it's open.
  - `autoplay` is false when the user pressed play to start this run of
    playback (until the next pause). Resuming because the video scrolled back
    into view counts as autoplay.
- `context` is `embed` (inline video) or `immersiveFeed`.
- `endReason` is why the segment ended: `paused`, `deactivated`,
  `backgrounded`, `buffering`, `checkpoint` (every 30 s), `ended`, `error`,
  `unmounted`, `looped`, `muteChanged` or `fullscreenChanged`. When a session's
  attribution or feed changes while the video keeps playing, the old session
  ends with `deactivated` and a new session starts.

A useful downstream measure is the watch ratio, `sum(durationMs) /
videoDurationMs` per session. It can go over 1 because of loops and replays,
so don't cap it or read it as completion; use `loop` for that.

Watching is passive, often autoplayed, and is not an explicit action. Don't
treat a watch event as a generic positive engagement signal (like a like or a
repost) when training. Missing data means unknown, not zero: no events for an
item doesn't mean it wasn't watched (older clients, surfaces without
attribution, dropped requests), and an absent `videoDurationMs` means the
length wasn't known.

## Privacy and gating

- Logged in only, sent only to Bluesky's Discover/Trending feeds (never to
  third-party feeds, like every unspecced event), and only when the flag is on.
  These are checked when a segment is queued and again when the batch is sent.
  Both checks also ask the session provider, live, whether the queue's client
  is still the signed-in session, so queued or late watch events are dropped
  after logout or an account switch, even when that removes the feed without
  re-rendering it.
- Attribution comes from the feed item the player is inside of
  (`useVideoWatchBinding`, from `FeedItemProvider`). Feed items and a thread's
  main post provide one; anything else (replies, profiles, chats) sends
  nothing.
- GIFs are excluded, same as the existing metric.
- Watch events don't count toward the `feed:engaged` or `feed:seen` stats.

## Delivery

Delivery is best effort, with no retries or persistence, same as the existing
interactions. Watch events share their throttled `sendInteractions` batch.
Segments ending in `backgrounded` or `unmounted` flush right away, so they
aren't lost if the feed's own lifecycle flush already ran. Each feed/client
binding has its own queue, so a late segment from an old binding goes out
through that old binding, never through a newer feed.
