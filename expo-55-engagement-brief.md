# Bluesky × Software Mansion — Expo 55 / New Architecture Migration

This document covers the outcomes we care about, how we'd like to work together, and how we'll measure success.
This brief gives them the goals, constraints, and targets needed to determine all of the above. Much of this is open to discuss
or change; the goal of this brief is to give a baseline.

---

## 1. Goals of the engagement

Four goals anchor this work. Everything else serves these:

1. **Reduce the technical burden** of maintenance and ongoing improvement.
2. **Reduce reliance on patches.**
3. **Remove or replace incompatible libraries.**
4. **Remove or rework features** where doing so serves goals 1–3.

From those, the outcomes that define success:

- **Land Expo 55 / New Arch / Reanimated 4 across iOS, Android, and web** with **no
  performance regressions** on our priority surfaces — and ideally measurable gains.
- **Establish objective, repeatable performance measurement.** We do not have a process
  for measuring performance objectively today. We want to come out of this with reasonable baselines and existing deltas.
  This will help us with establishing perf practices within CI down the road.

During the engagement, we'd propose two collaborative pieces:

1. When a surface is slow or a component is hard to migrate, we want SWM to identify *why* and bring it back to us with options, unless there is a known/hardened workaround with low stakes.
2. **A QA-driven discovery pass is welcome.** One model on the table: enable New
Architecture, run a thorough QA pass across the app, enumerate the issues that emerge, then
jointly prioritize them into fix-now / we-fix / backlog. We're open to SWM's preferred
variant of this.

---

## 2. Performance: targets & success criteria

We don't have an objective performance process today; establishing one is a goal of ours.
The targets below are our starting success criteria, sourced from platform guidance
(Apple talks, Android vitals), web vitals, arithmetic on frame budgets, and team practice.

**These are a starting point.** We'd welcome SWM validating and refining them against real
baselines on real devices, especially any that lean on judgment calls.

### Hard-sourced targets

| Metric                        | Target   | Borderline | Broken    |
| ----------------------------- | -------- | ---------- | --------- |
| Hitch time ratio (iOS)        | < 5 ms/s | 5–10 ms/s  | > 10 ms/s |
| INP interaction latency (web) | < 200 ms | 200–500 ms | > 500 ms  |

**Frame budgets:** 60 Hz ≈ 16.6 ms · 90 Hz ≈ 11 ms · 120 Hz ≈ 8.3 ms.

**Android frames:**
- *Slow frames* = 16 ms–700 ms. Excessive = > 50% of frames missing the 16 ms deadline per
  session.
- *Frozen frames* = > 700 ms. Excessive = > 0.1% of frames over 700 ms per session.

### Engineering-best-practice targets

| Metric                         | Target | Borderline | Notes                                                                                                   |
| ------------------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| Feed scroll UI FPS (60 Hz)     | ≥ 58   | 50–57      | Smooth within ~1 frame of refresh rate is the consensus bar.                                            |
| Feed scroll UI FPS p10 (60 Hz) | ≥ 52   | 45–52      | p10 catches occasional jank the median hides. Generalized threshold.                                    |
| Feed scroll UI FPS (120 Hz)    | > 110  | 90–109     | ProMotion can legitimately drop to ~80 under thermal load; expect false positives.                      |
| JS FPS during animations       | ≥ 50   | 40–50      | Worklets run on the UI thread, so this is a JS-starvation / tap-response indicator, not scroll quality. |
| Cold start TTI                 | < 2 s  | 2–5 s      |                                                                                                         |

---

## 3. Priority surfaces

Our priority surfaces, ranked by importance:

1. **Feed scroll**: the central performance concern. Reanimated wraps effectively every
   list, and this is where the jank lives.
2. **Lightbox**
3. **Context menu**: measured as long-press-to-visible time.
4. **Dialog / bottom sheet**
5. **Pager**

Baseline surfaces we specifically care about: **feed scrolling, lightbox, and composer.**

**Specific area of interest is Reanimated in lists, and the pager.** We suspect the pager
forces Reanimated into the scroll path for our lists. We'd value SWM's read on whether
removing or reworking the pager would let lists shed Reanimated, and what that buys us.
We're open to a significant rework here if the performance case supports it.

---

## 4. Device matrix & measurement methodology

Device matrix (three tiers) to cover our usage bases:

- **High-end iOS** (e.g., a recent ProMotion iPhone)
- **Mid-range Android**
- **Bottom-tier Android** — Go-class / ≤ 3 GB RAM

**Per-device baseline captures:**

- Feed scroll FPS during a 30-second flick
- Context-menu long-press-to-visible time
- Dialog-open frames
- Cold-start TTI

**Existing tooling to build on.** The repo already has `flashlight` + `maestro` perf
scripts (`perf:test`, `perf:test:measure`, `perf:measure`) as a starting point.
We're open to ideas on what to add/change/remove for this.

**Understanding the perf delta.** We'd like to baseline across all three devices, then
migrate a perf-critical surface (likely feed scroll) and remeasure — so we can see a clean
before/after delta and understand the real performance gaps before sizing the rest of the
work. Also open to a better method/surface of determining the deltas.

---

## 5. Open questions for SWM

Not needed immediately, but comes to mind while thinking through the full engagement:

- For **bottom sheets and video** — what are we doing that's already been solved upstream?
- What **custom modules and patches** can be retired because Expo or the ecosystem now
  covers them?
- Given how heavily we lean on Reanimated in lists, **where's the biggest perf win** — and
  is removing/reworking the pager part of it?
- What **performance targets** would *you* set, given the baselines?
- Which **surface should we pilot first** for the cleanest perf delta?
