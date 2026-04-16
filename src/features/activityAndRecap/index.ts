/**
 * Activity & Recap feature (ticket i9KLo7kw).
 *
 * Single feature module owning the streak indicator, weekly recap, and
 * the per-account Settings sub-screen. All gated by
 * `useStreaksAndRecapEnabled()` + per-account preference toggles.
 *
 * Entry points:
 * - `ActivityAndRecapProvider` — mounts `useStreakTracker` in the signed-in shell (S20).
 * - `clearActivityAndRecapDataForDid` — called on account removal (S21).
 * - Components: `StreakIndicator`, `WeeklyRecapCard`, `StreakExplainerDialog`.
 * - Screens: `RecapScreen`, `PastRecapsScreen`, `ActivityAndRecapSettingsScreen`.
 */
export {clearActivityAndRecapDataForDid} from '#/features/activityAndRecap/clearActivityAndRecapDataForDid'
export * from '#/features/activityAndRecap/constants'
export {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
export {ActivityAndRecapProvider} from '#/features/activityAndRecap/hooks/useStreakTracker'
export * from '#/features/activityAndRecap/types'
