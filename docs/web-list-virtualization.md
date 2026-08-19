# Web list virtualization investigation (APP-2859)

## Current behavior

The shared `List` has different implementations by platform. Native renders an
animated React Native `FlatList`, which maintains a bounded render window. Web
maps the complete `data` array to `Row` components. Every page retained by a
query therefore adds React instances, DOM nodes, intersection observers for
seen-item tracking, media, and event handlers for the rest of that screen's
lifetime.

The cost grows with loaded history rather than viewport size. Long-running web
sessions can consequently accumulate slower reconciliation, layout/style work,
larger garbage collections, and more memory pressure. Navigating away releases
a list, but a user who keeps scrolling one feed or another persistent timeline
continues to grow it.

## Diagnostic telemetry

Ten percent of web page sessions report two content-free metrics from the
shared web `List`:

- `web:list:size` fires once per list instance at 100, 250, 500, and 1,000
  loaded items. It includes mounted row count, content height, page-session age,
  and Chromium heap figures when the browser exposes them.
- `web:list:longTasks` aggregates main-thread tasks over 50 ms into one event
  per minute while a visible list has at least 100 items. It includes count,
  total/max blocked time, current list size, and the same memory diagnostics.

Existing navigation metadata identifies the route/surface. No post, account,
or row content is collected. Compare long-task rate and heap use across size
buckets; also compare route abandonment or reloads if those events are
available downstream. Safari and Firefox do not currently expose the Long
Tasks API or Chromium's non-standard heap counters, so size telemetry remains
the cross-browser baseline.

## Implementation shape

A production virtualizer must support variable-height rows, window scrolling
and nested fixed-height containers, pagination sentinels, scroll restoration,
`scrollToIndex`, item-seen semantics, headers/footers, and prepend/maintained
position behavior. Feed rows also contain video and image state, so recycling
must correctly stop offscreen playback and avoid stale row state.

A practical sequence is:

1. Build a web-only windowing layer behind the existing `List` interface. Use
   measured row heights plus an overscan region and top/bottom spacers so the
   public call sites remain platform-agnostic.
2. Preserve the current `IntersectionObserver` contracts on mounted rows and
   edge sentinels. Implement indexed scrolling from cached measurements, with
   measurement/refinement when the target has not mounted yet.
3. Validate the home feed first: pagination in both directions, refresh,
   restoration, embeds, keyboard focus, screen readers, and resize/reflow.
4. Roll out by surface and compare the new bounded mounted-row count and long
   tasks against the telemetry above. Keep an escape hatch for incompatible
   lists until all shared-list behaviors are covered.

Using CSS `content-visibility` may reduce paint/layout work as an interim
experiment, but it does not bound React instances, observers, media state, or
JavaScript heap and is not a complete fix.

## Communities recommendation

Communities will inherit this behavior if their timeline uses the shared web
`List`. Virtualization does not need to block an initial release if community
queries keep a deliberately bounded number of pages and normal navigation
unmounts the timeline. It should be a prerequisite for an unbounded or highly
persistent community timeline, and the API should be built on the shared
`List` now so the later virtualizer is inherited without a community-specific
rewrite.

Before launch, use the new size buckets to set that temporary page cap and
confirm that expected community sessions do not routinely enter the first
bucket where long-task time or memory begins rising materially. Remove this
diagnostic instrumentation once the rollout decision has enough production
data.
