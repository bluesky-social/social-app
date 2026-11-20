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
  const hasSocialProof = !!shouldShowKnownFollowers(
    app.profile?.viewer?.knownFollowers,
  )

  return {
    appProfileDid: app.profile?.did,
    appUrl: app.url,
    appCategory: app.category,
    position,
    hasSocialProof,
    selectedCategory,
  }
}
