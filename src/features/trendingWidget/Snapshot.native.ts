import {createWidgetTopicUrl} from '#/features/trendingWidget/links'
import TrendingTopicsWidget from '#/features/trendingWidget/TrendingTopicsWidget'
import {type app} from '#/lexicons'

export type TrendingWidgetCopy = {
  emptyMessage: string
  title: string
}

type Trend = app.bsky.unspecced.getTrends.$OutputBody['trends'][number]

export function updateTrendingWidgetSnapshot(
  trends: Trend[],
  copy: TrendingWidgetCopy,
  recId?: string,
) {
  TrendingTopicsWidget.updateSnapshot({
    emptyMessage: copy.emptyMessage,
    title: copy.title,
    topics: trends.map((trend, index) => ({
      displayName: trend.displayName,
      description: trend.description,
      destination: createWidgetTopicUrl(trend.link, {rank: index + 1, recId}),
    })),
  })
}
