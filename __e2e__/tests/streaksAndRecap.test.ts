/**
 * E2E flow specifications for Streaks + Lightweight Gamification (S22).
 *
 * The Bluesky e2e harness uses Maestro YAML flows under `__e2e__/flows/`.
 * The plan binds S22 to a single TypeScript spec file enumerating the six
 * required user journeys so device-driven authoring (Maestro / Detox) can
 * follow this contract verbatim. Each `test.todo` carries the precise
 * navigation, assertions, and persistence expectations derived from the
 * acceptance criteria.
 *
 * The suite is wrapped in `describe.skip` so it stays out of the active
 * Jest runner (no real device + no XRPC). The tests are intentionally
 * authored as `.todo` so the e2e team gets a structured to-do list and the
 * file still compiles + lints inside the unit-test toolchain.
 *
 * Coverage: A6, A7, A8, B3, B5, X1, X3.
 */

import {describe, test} from '@jest/globals'

describe.skip('Streaks + Recap — E2E flows (S22)', () => {
  /*
   * Flow 1 — streak-indicator-visibility
   *
   * Covers AC: A6 (streak visible in Home header), A7 (hidden when no
   *            session, hidden when feature flag off).
   *
   * Steps (Maestro pseudocode):
   *   1. Launch app with feature flag ON, no logged-in account.
   *      → assertNotVisible: testID "streakIndicator".
   *   2. Sign in as alice.test.
   *      → assertVisible: testID "streakIndicator" inside the Home header.
   *      → assertVisible: streak count >= 1 (formatted plural string).
   *   3. Navigate to /notifications.
   *      → assertNotVisible: testID "streakIndicator" (only Home tab).
   *   4. Toggle feature flag OFF (Statsig override panel).
   *   5. Restart app, sign in.
   *      → assertNotVisible: testID "streakIndicator".
   */
  test.todo('A6/A7: streak indicator visible only with session + flag ON')

  /*
   * Flow 2 — streak-explainer-open-and-settings-link
   *
   * Covers AC: A8 (tapping streak opens explainer dialog with a link to
   *            "Activity & recap" settings). This flow specifically
   *            exercises the dialog-close callback footgun (CLAUDE.md):
   *            the link must navigate AFTER the dialog finishes its close
   *            animation.
   *
   * Steps:
   *   1. Sign in. Tap testID "streakIndicator".
   *      → assertVisible: text "Your streak" (dialog title).
   *      → assertVisible: testID "streakExplainer-settingsLink".
   *   2. Tap testID "streakExplainer-settingsLink".
   *      → assertVisible: testID "activityAndRecapSettingsScreen"
   *        within 1500ms (covers control.close(() => navigate()) delay).
   *      → assertNotVisible: dialog backdrop.
   */
  test.todo('A8: streak explainer dialog → settings link uses close callback')

  /*
   * Flow 3 — recap-card-tap-opens-recap
   *
   * Covers AC: B3 (tapping the WeeklyRecapCard opens the Recap screen
   *            for the previous ISO week).
   *
   * Steps:
   *   1. Sign in. Stub the recap query to return a week with postsCount=5,
   *      followerDelta=2, and a topPost candidate.
   *   2. Navigate to /notifications.
   *      → assertVisible: testID "weeklyRecapCard".
   *      → assertVisible: testID "weeklyRecapCard-posts".
   *   3. tapOn testID "weeklyRecapCard".
   *      → assertVisible: testID "recapScreen".
   *      → assertVisible: testID "recapScreen-posts".
   *      → URL/route should match /recap/<priorWeekIso>.
   */
  test.todo(
    'B3: tapping WeeklyRecapCard navigates to RecapScreen for that week',
  )

  /*
   * Flow 4 — recap-card-dismiss-persists
   *
   * Covers AC: B5 (dismissing the WeeklyRecapCard hides it for that week
   *            and the dismissal survives an app restart).
   *
   * Steps:
   *   1. Sign in. Navigate to /notifications.
   *      → assertVisible: testID "weeklyRecapCard".
   *   2. tapOn label "Dismiss recap".
   *      → assertNotVisible: testID "weeklyRecapCard".
   *   3. Force-quit and relaunch the app. Sign in. Navigate to
   *      /notifications.
   *      → assertNotVisible: testID "weeklyRecapCard" (MMKV-backed
   *        dismissal must persist for the same weekIso).
   */
  test.todo('B5: WeeklyRecapCard dismissal persists across app restart')

  /*
   * Flow 5 — activity-and-recap-settings-roundtrip
   *
   * Covers AC: X1 (toggling "Show streak" / "Show weekly recap" in
   *            Settings → Activity & recap immediately hides the
   *            indicator and the card respectively, with no app reload).
   *
   * Steps:
   *   1. Sign in. Confirm streak indicator visible on Home.
   *   2. Navigate to /settings/content-and-media → tap "Activity & recap".
   *      → assertVisible: testID "activityAndRecapSettingsScreen".
   *   3. Toggle off "Show streak".
   *   4. Navigate back to Home.
   *      → assertNotVisible: testID "streakIndicator".
   *   5. Navigate to /notifications. Toggle off "Show weekly recap" via
   *      the same settings screen route.
   *      → assertNotVisible: testID "weeklyRecapCard".
   *   6. Toggle both back on.
   *      → assertVisible: streak indicator AND recap card.
   */
  test.todo('X1: Activity & recap settings toggles round-trip without restart')

  /*
   * Flow 6 — fresh-install-no-nux
   *
   * Covers AC: X3 (no first-run NUX, modal, or coachmark for streaks or
   *            recap on a fresh install — the feature is discoverable but
   *            not interruptive).
   *
   * Steps:
   *   1. Wipe app data (`clearState`). Launch app fresh.
   *   2. Complete sign-in.
   *      → assertNotVisible: any modal/coachmark referencing "streak"
   *        or "recap" or "Your week on Bluesky" (text + testID variants).
   *   3. Navigate Home → Notifications → Settings.
   *      → No interruptive overlay appears at any point.
   *      → Streak indicator + recap card are passively visible per their
   *        own visibility rules; no NUX/welcome dialog is presented.
   */
  test.todo('X3: fresh install presents no NUX/coachmark for streaks or recap')
})
