import {type filterTrends} from '#/state/queries/trending/useGetTrendsQuery'
import {type TrendingWidgetCopy} from '#/features/trendingWidget/Snapshot'

type BackgroundConfig = {
  contentLanguages: string[]
  copy: TrendingWidgetCopy
  interests: string
  mutedWords: Parameters<typeof filterTrends>[1]
}

export async function registerTrendingWidgetBackgroundTask() {}

export async function saveTrendingWidgetBackgroundConfig(
  _config: BackgroundConfig,
) {}
