import {type app} from '#/lexicons'

export type TrendingWidgetCopy = {
  emptyMessage: string
  locale: string
  postPlural: string
  postSingular: string
  title: string
}

type Trend = app.bsky.unspecced.getTrends.$OutputBody['trends'][number]

export function updateTrendingWidgetSnapshot(
  _trends: Trend[],
  _copy: TrendingWidgetCopy,
) {}
