import TrendingTopicsWidget from '#/features/trendingWidget/TrendingTopicsWidget'
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
  trends: Trend[],
  copy: TrendingWidgetCopy,
) {
  const numberFormatter = new Intl.NumberFormat(copy.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
    roundingMode: 'trunc',
  })
  const pluralRules = new Intl.PluralRules(copy.locale)

  TrendingTopicsWidget.updateSnapshot({
    title: copy.title,
    emptyMessage: copy.emptyMessage,
    topics: trends.map(trend => ({
      displayName: trend.displayName,
      description: trend.description,
      destination: trend.link.startsWith('http')
        ? trend.link
        : `https://bsky.app${trend.link.startsWith('/') ? '' : '/'}${trend.link}`,
      postCountLabel: `${numberFormatter.format(trend.postCount)} ${
        pluralRules.select(trend.postCount) === 'one'
          ? copy.postSingular
          : copy.postPlural
      }`,
    })),
  })
}
