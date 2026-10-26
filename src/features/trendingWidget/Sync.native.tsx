import {useEffect, useState} from 'react'
import {AppState} from 'react-native'
import {WidgetInfo} from '@bsky.app/expo-bluesky-swiss-army'
import {useLingui} from '@lingui/react/macro'

import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {useLanguagePrefs} from '#/state/preferences'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useGetTrendsQuery} from '#/state/queries/trending/useGetTrendsQuery'
import {
  clearTrendingWidgetBackgroundConfig,
  registerTrendingWidgetBackgroundTask,
  saveTrendingWidgetBackgroundConfig,
  unregisterTrendingWidgetBackgroundTask,
} from '#/features/trendingWidget/BackgroundTask'
import {updateTrendingWidgetSnapshot} from '#/features/trendingWidget/Snapshot'

export function TrendingTopicsWidgetSync() {
  const {t: l} = useLingui()
  /**
   * `undefined` until the first check finishes.
   */
  const [isWidgetInstalled, setIsWidgetInstalled] = useState<boolean>()
  const {data} = useGetTrendsQuery({
    enabled: isWidgetInstalled === true,
    fetchLimit: 10,
    limit: 10,
    refetchOnWindowFocus: true,
  })
  const {data: preferences} = usePreferencesQuery()
  const languagePrefs = useLanguagePrefs()
  const copy = {
    emptyMessage: l`No trending topics are available right now.`,
    title: l`Trending on Bluesky`,
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

  // keep the background refresh registered only while the widget is installed
  useEffect(() => {
    if (isWidgetInstalled === undefined) return

    const update = isWidgetInstalled
      ? registerTrendingWidgetBackgroundTask
      : unregisterTrendingWidgetBackgroundTask
    update().catch(error => {
      logger.error('Failed to update the trending widget background task', {
        safeMessage: error,
      })
    })
  }, [isWidgetInstalled])

  useEffect(() => {
    /*
     * Without this account's preferences, skip background refreshes rather
     * than filter them with a previous account's muted words.
     */
    if (!preferences) {
      clearTrendingWidgetBackgroundConfig().catch(error => {
        logger.error('Failed to clear the trending widget background config', {
          safeMessage: error,
        })
      })
      return
    }

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

  /*
   * The widget is only visible while the app isn't, so sync it whenever the
   * app leaves the foreground. That also re-renders it, which picks up things
   * like a light/dark mode change. If the trends arrive after the app has
   * already left, sync straight away.
   */
  useEffect(() => {
    if (!data) return

    const sync = () => {
      try {
        updateTrendingWidgetSnapshot(data.trends, copy)
      } catch (error) {
        logger.error('Failed to update the trending topics widget', {
          safeMessage: error,
        })
      }
    }

    let isActive = AppState.currentState === 'active'
    if (!isActive) {
      sync()
    }
    // iOS goes through `inactive` on the way to `background`
    const subscription = AppState.addEventListener('change', state => {
      if (isActive && state !== 'active') {
        sync()
      }
      isActive = state === 'active'
    })

    return () => subscription.remove()
  }, [copy, data])

  return null
}
