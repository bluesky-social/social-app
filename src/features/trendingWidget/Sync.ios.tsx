import {useEffect, useState} from 'react'
import {AppState} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {useLanguagePrefs} from '#/state/preferences'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useGetTrendsQuery} from '#/state/queries/trending/useGetTrendsQuery'
import {
  registerTrendingWidgetBackgroundTask,
  saveTrendingWidgetBackgroundConfig,
} from '#/features/trendingWidget/BackgroundTask'
import {updateTrendingWidgetSnapshot} from '#/features/trendingWidget/Snapshot'
import {WidgetInfo} from '../../../modules/expo-bluesky-swiss-army'

export function TrendingTopicsWidgetSync() {
  const {i18n, t: l} = useLingui()
  const [isWidgetInstalled, setIsWidgetInstalled] = useState(false)
  const {data} = useGetTrendsQuery({
    enabled: isWidgetInstalled,
    fetchLimit: 10,
    limit: 5,
    refetchOnWindowFocus: true,
  })
  const {data: preferences} = usePreferencesQuery()
  const languagePrefs = useLanguagePrefs()
  const copy = {
    title: l`Trending`,
    emptyMessage: l`No trending topics are available right now.`,
    postSingular: l`post`,
    postPlural: l`posts`,
    locale: i18n.locale,
  }

  useEffect(() => {
    let cancelled = false

    const updateInstalledState = async () => {
      try {
        const isInstalled = await WidgetInfo.isInstalled('TrendingTopicsWidget')
        if (!cancelled) {
          setIsWidgetInstalled(isInstalled)
        }
      } catch (error) {
        logger.error(
          'Failed to check whether the trending widget is installed',
          {
            safeMessage: error,
          },
        )
      }
    }

    void updateInstalledState()
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void updateInstalledState()
      }
    })

    return () => {
      cancelled = true
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    registerTrendingWidgetBackgroundTask().catch(error => {
      logger.error('Failed to register the trending widget background task', {
        safeMessage: error,
      })
    })
  }, [])

  useEffect(() => {
    if (!preferences) return

    saveTrendingWidgetBackgroundConfig({
      contentLanguages: languagePrefs.contentLanguages,
      interests: aggregateUserInterests(preferences),
      mutedWords: preferences.moderationPrefs.mutedWords,
      copy,
    }).catch(error => {
      logger.error('Failed to save the trending widget background config', {
        safeMessage: error,
      })
    })
  }, [copy, languagePrefs.contentLanguages, preferences])

  useEffect(() => {
    if (!data) return

    try {
      updateTrendingWidgetSnapshot(data.trends, copy)
    } catch (error) {
      logger.error('Failed to update the trending topics widget', {
        safeMessage: error,
      })
    }
  }, [copy, data])

  return null
}
