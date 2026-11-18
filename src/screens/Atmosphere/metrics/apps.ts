import {shouldShowKnownFollowers} from '#/components/KnownFollowers'
import {type app} from '#/lexicons'
import {
  type AtmosphereAppMetricContext,
  type AtmosphereMetricContext,
} from './types'

/** The app card's own part of `AtmosphereAppMetricContext`. */
export type AppMetric = Omit<
  AtmosphereAppMetricContext,
  keyof AtmosphereMetricContext
>

export function getAppMetric({
  app,
  position,
  selectedCategory,
}: {
  app:
    | app.bsky.unspecced.getAtmosphereApps.AppCard
    | app.bsky.unspecced.getAtmosphereExploreTab.AppCard
  position: number
  selectedCategory?: string
}): AppMetric {
  return {
    // Apps without an ID are filtered out before they render
    appId: app.id ?? '',
    appCategory: app.category,
    position,
    hasKnownFollowers: !!shouldShowKnownFollowers(
      app.profile?.viewer?.knownFollowers,
    ),
    selectedCategory,
  }
}
