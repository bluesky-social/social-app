import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {createBskyTopicsHeader} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {filterTrends} from '#/state/queries/trending/useGetTrendsQuery'
import {getPublicAppviewClient} from '#/state/session/clients'
import {
  type TrendingWidgetCopy,
  updateTrendingWidgetSnapshot,
} from '#/features/trendingWidget/Snapshot'
import {app} from '#/lexicons'
import {WidgetInfo} from '../../../modules/expo-bluesky-swiss-army'

const TASK_NAME = 'bluesky-trending-widget-refresh'
const CONFIG_KEY = 'bluesky-trending-widget-background-config'
const FETCH_LIMIT = 10
const DISPLAY_LIMIT = 5
const MINIMUM_INTERVAL_MINUTES = 60

type BackgroundConfig = {
  contentLanguages: string[]
  copy: TrendingWidgetCopy
  interests: string
  mutedWords: Parameters<typeof filterTrends>[1]
}

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const isInstalled = await WidgetInfo.isInstalled('TrendingTopicsWidget')
    if (!isInstalled) {
      return BackgroundTask.BackgroundTaskResult.Success
    }

    const storedConfig = await AsyncStorage.getItem(CONFIG_KEY)
    if (!storedConfig) {
      return BackgroundTask.BackgroundTaskResult.Success
    }

    const config: BackgroundConfig = JSON.parse(storedConfig)
    const data = await getPublicAppviewClient().call(
      app.bsky.unspecced.getTrends,
      {limit: FETCH_LIMIT},
      {
        headers: {
          ...createBskyTopicsHeader(config.interests),
          'Accept-Language': config.contentLanguages.join(','),
        },
      },
    )
    const trends = filterTrends(
      data.trends ?? [],
      config.mutedWords,
      DISPLAY_LIMIT,
    )

    updateTrendingWidgetSnapshot(trends, config.copy)
    return BackgroundTask.BackgroundTaskResult.Success
  } catch (error) {
    logger.error('Failed to refresh the trending widget in the background', {
      safeMessage: error,
    })
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

export async function registerTrendingWidgetBackgroundTask() {
  await BackgroundTask.registerTaskAsync(TASK_NAME, {
    minimumInterval: MINIMUM_INTERVAL_MINUTES,
  })
}

export async function saveTrendingWidgetBackgroundConfig(
  config: BackgroundConfig,
) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}
