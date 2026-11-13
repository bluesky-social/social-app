import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {ActivityContentHider} from '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider'
import {ActivityHeader} from '#/screens/Atmosphere/ActivityTab/components/ActivityHeader'
import {ActivityContentCard} from '#/screens/Atmosphere/ActivityTab/components/ActivityRow'
import {type ActivityCardRow} from '#/screens/Atmosphere/ActivityTab/rows'
import {getAssociatedProfile} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {site, social} from '#/lexicons'
import {
  type DiscoverItem,
  useAtmosphereRecommendedActivityQuery,
} from './useAtmosphereRecommendedActivityQuery'

export function AtmosphereDiscoverTab() {
  const {t: l} = useLingui()
  const {data, isError, refetch} = useAtmosphereRecommendedActivityQuery()
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function onRefresh() {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const errorMessage = (
    <ErrorMessage
      message={l`Could not load recommendations. Please try again.`}
      onPressTryAgain={() => void refetch()}
    />
  )

  return (
    <List
      testID="atmosphereDiscoverTab"
      data={data?.items ?? []}
      keyExtractor={(item: DiscoverItem) => item.content.view.uri}
      renderItem={({item}: {item: DiscoverItem}) => (
        <DiscoverCard item={item} />
      )}
      refreshing={isRefreshing}
      onRefresh={() => void onRefresh()}
      ListHeaderComponent={data && isError ? errorMessage : undefined}
      ListEmptyComponent={
        !data ? (
          isError ? (
            errorMessage
          ) : (
            <View
              testID="atmosphereDiscoverLoading"
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={l`Loading recommendations`}
              accessibilityHint=""
              style={[a.align_center, a.justify_center, a.py_5xl]}>
              <Loader size="xl" />
            </View>
          )
        ) : (
          <EmptyState />
        )
      }
      sideBorders={false}
    />
  )
}

function DiscoverCard({item: {content, moderation}}: {item: DiscoverItem}) {
  const t = useTheme()
  /** Infer a creation event; the recommendation response has no activities. */
  let row: ActivityCardRow | undefined
  if (content.type === 'article' || content.type === 'gallery') {
    const actor = getAssociatedProfile(content.view.associatedProfiles)
    if (actor && content.view.createdAt) {
      row = {
        kind: 'card',
        key: content.view.uri,
        collection:
          content.type === 'article'
            ? site.standard.document.$type
            : social.grain.gallery.$type,
        actor,
        indexedAt: content.view.createdAt,
        activityCount: 1,
        otherActorCount: 0,
        related: [],
        content,
        moderation,
      }
    }
  }

  return (
    <View
      testID="atmosphereDiscoverCard"
      style={[a.gap_md, a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      {row ? <ActivityHeader row={row} /> : null}
      <ActivityContentHider moderation={moderation}>
        <ActivityContentCard content={content} />
      </ActivityContentHider>
    </View>
  )
}

function EmptyState() {
  const t = useTheme()
  return (
    <View
      testID="atmosphereDiscoverEmpty"
      style={[a.align_center, a.px_xl, a.py_5xl]}>
      <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
        <Trans>No recommendations right now. Check back soon.</Trans>
      </Text>
    </View>
  )
}
