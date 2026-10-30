# Video watch feed feedback (provisional)

Sends per-segment video watch time to the feed generator that recommended the
post, through the existing `app.bsky.feed.sendInteractions` call. This is the
client side only. It's off by default behind the `feed:video_watch:enable`
GrowthBook flag (`Features.FeedVideoWatchEnable`).

## Status

This contract is **provisional**. The published `app.bsky.feed.defs` lexicon
has no watch event or payload yet, and we don't hand-edit published lexicons
(see `lexicons/README.md`). The client sends an additive local extension of
`app.bsky.feed.defs#interaction`. The lex client serializes JSON bodies as-is,
so the extra field reaches the feed generator.

Keep the flag off until all of these are done:

1. Protocol agrees on and publishes the event and payload (names may change).
2. The receiving feed generators accept and forward it.
3. The warehouse schema is deployed with every payload field nullable.

None of this has been verified end to end. Backend ingestion is a separate
piece of work.

## Payload

```json
{
  "item": "at://did:plc:…/app.bsky.feed.post/…",
  "event": "app.bsky.feed.defs#interactionVideoWatch",
  "feedContext": "…",
  "reqId": "…",
  "videoWatch": {
    "durationMs": 4180,
    "videoDurationMs": 30033,
    "playbackSessionId": "V1StGXR8_Z5jdHi6B-myT",
    "segmentIndex": 0,
    "context": "embed",
    "endReason": "paused"
  }
}
```

- `item`, `feedContext` and `reqId` belong to the **recommended feed item**.
  For a quoted video that's the outer post, not the quoted one.
- `durationMs` is the watch time in this segment only (a delta). It reuses the
  segments behind the `video:playback:duration` metric, so the clock and its
  rules (wall-clock time between advancing progress callbacks, no time while
  paused, buffering or backgrounded) are the same.
- `playbackSessionId` + `segmentIndex` identify a segment. Repeated copies of
  one segment within a batch are collapsed, and distinct segments and replays
  are kept. Downstream should still dedupe on
  `(playbackSessionId, segmentIndex)` and sum `durationMs` per session.
- `videoDurationMs` is the authoritative length in milliseconds, or **absent**
  when unknown. Never zero or estimated. It's sent from web (the media
  element's `duration`) and the immersive feed (expo-video's `sourceLoad`
  event for this item's own source). Native inline embeds omit it because
  their player only reports remaining time. Pooled immersive players can miss
  the load event of a preloaded source, in which case it's omitted too.
- `context` is `embed` (inline feed video) or `immersiveFeed`.
- `endReason` is the existing tracker end reason. When a session's attribution
  or feed changes while the video keeps playing, the old session ends with
  `deactivated` and a new session starts.

A useful downstream measure is the watch ratio, `sum(durationMs) /
videoDurationMs` per session. It can go over 1 because of loops and replays,
so don't cap it or read it as completion. The client deliberately sends no
percentage or completion flag.

Watching is passive, often autoplayed, and is not an explicit action. Don't
treat a watch event as a generic positive engagement signal (like a like or a
repost) when training. Missing data means unknown, not zero: no events for an
item doesn't mean it wasn't watched (older clients, surfaces without explicit
attribution, dropped requests), and an absent `videoDurationMs` means the
length wasn't known.

## Privacy and gating

- Logged in only, sent only to official Discover/Trending feeds (never to
  third-party feeds, even ones that accept interactions), and only when the
  flag is on. These are checked when a segment is queued and again when the
  batch is sent. Both checks also ask the session provider, live, whether
  the queue's client is still the signed-in session, so queued or
  late watch events are dropped after logout or an account switch, even when
  that removes the feed without re-rendering it.
- Attribution must be passed in explicitly by the feed item
  (`PostFeedItem` -> `Embed` -> `VideoEmbed`, or the immersive video feed). It
  is never inferred from the surrounding feed context, so threads, previews
  and chats send nothing.
- GIFs are excluded, same as the existing metric.
- Watch events don't count toward the `feed:engaged` or `feed:seen` stats.

## Delivery

Delivery is best effort, with no retries or persistence, same as the existing
interactions. Watch events share their throttled `sendInteractions` batch.
Segments ending in `backgrounded` or `unmounted` flush right away, so they
aren't lost if the feed's own lifecycle flush already ran.
Each feed/client binding has its own queue, so a late segment from an old
binding goes out through that old binding, never through a newer feed.
