import React, {forwardRef, ForwardedRef} from 'react'
import {RefreshControl, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs} from '@atproto/api'
import {CenteredView, FlatList} from '../util/Views'
import {FoafsModel} from 'state/models/discovery/foafs'
import {
  SuggestedActorsModel,
  SuggestedActor,
} from 'state/models/discovery/suggested-actors'
import {Text} from '../util/text/Text'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ProfileCardFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {RefWithInfoAndFollowers} from 'state/models/discovery/foafs'
import {usePalette} from 'lib/hooks/usePalette'

interface Heading {
  _reactKey: string
  type: 'heading'
  title: string
}
interface RefWrapper {
  _reactKey: string
  type: 'ref'
  ref: RefWithInfoAndFollowers
}
interface SuggestWrapper {
  _reactKey: string
  type: 'suggested'
  suggested: SuggestedActor
}
interface ProfileView {
  _reactKey: string
  type: 'profile-view'
  view: AppBskyActorDefs.ProfileViewBasic
}
type Item = Heading | RefWrapper | SuggestWrapper | ProfileView

export const Suggestions = observer(
  forwardRef(
    (
      {
        foafs,
        suggestedActors,
      }: {
        foafs: FoafsModel
        suggestedActors: SuggestedActorsModel
      },
      flatListRef: ForwardedRef<FlatList>,
    ) => {
      const pal = usePalette('default')
      const [refreshing, setRefreshing] = React.useState(false)
      const data = React.useMemo(() => {
        let items: Item[] = []

        if (foafs.popular.length > 0) {
          items = items
            .concat([
              {
                _reactKey: '__popular_heading__',
                type: 'heading',
                title: 'In Your Network',
              },
            ])
            .concat(
              foafs.popular.map(ref => ({
                _reactKey: `popular-${ref.did}`,
                type: 'ref',
                ref,
              })),
            )
        }
        if (suggestedActors.hasContent) {
          items = items
            .concat([
              {
                _reactKey: '__suggested_heading__',
                type: 'heading',
                title: 'Suggested Follows',
              },
            ])
            .concat(
              suggestedActors.suggestions.map(suggested => ({
                _reactKey: `suggested-${suggested.did}`,
                type: 'suggested',
                suggested,
              })),
            )
        }
        for (const source of foafs.sources) {
          const item = foafs.foafs.get(source)
          if (!item || item.follows.length === 0) {
            continue
          }
          items = items
            .concat([
              {
                _reactKey: `__${item.did}_heading__`,
                type: 'heading',
                title: `Followed by ${sanitizeDisplayName(
                  item.displayName || item.handle,
                )}`,
              },
            ])
            .concat(
              item.follows.slice(0, 10).map(view => ({
                _reactKey: `${item.did}-${view.did}`,
                type: 'profile-view',
                view,
              })),
            )
        }

        return items
      }, [
        foafs.popular,
        suggestedActors.hasContent,
        suggestedActors.suggestions,
        foafs.sources,
        foafs.foafs,
      ])

      const onRefresh = React.useCallback(async () => {
        setRefreshing(true)
        try {
          await foafs.fetch()
        } finally {
          setRefreshing(false)
        }
      }, [foafs, setRefreshing])

      const renderItem = React.useCallback(
        ({item}: {item: Item}) => {
          if (item.type === 'heading') {
            return (
              <Text type="title" style={[styles.heading, pal.text]}>
                {item.title}
              </Text>
            )
          }
          if (item.type === 'ref') {
            return (
              <View style={[styles.card, pal.view, pal.border]}>
                <ProfileCardWithFollowBtn
                  key={item.ref.did}
                  profile={item.ref}
                  noBg
                  noBorder
                  followers={
                    item.ref.followers
                      ? (item.ref.followers as AppBskyActorDefs.ProfileView[])
                      : undefined
                  }
                />
              </View>
            )
          }
          if (item.type === 'profile-view') {
            return (
              <View style={[styles.card, pal.view, pal.border]}>
                <ProfileCardWithFollowBtn
                  key={item.view.did}
                  profile={item.view}
                  noBg
                  noBorder
                />
              </View>
            )
          }
          if (item.type === 'suggested') {
            return (
              <View style={[styles.card, pal.view, pal.border]}>
                <ProfileCardWithFollowBtn
                  key={item.suggested.did}
                  profile={item.suggested}
                  noBg
                  noBorder
                />
              </View>
            )
          }
          return null
        },
        [pal],
      )

      if (foafs.isLoading || suggestedActors.isLoading) {
        return (
          <CenteredView>
            <ProfileCardFeedLoadingPlaceholder />
          </CenteredView>
        )
      }
      return (
        <FlatList
          ref={flatListRef}
          data={data}
          keyExtractor={item => item._reactKey}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          renderItem={renderItem}
          initialNumToRender={15}
        />
      )
    },
  ),
)

const styles = StyleSheet.create({
  heading: {
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 16,
  },

  card: {
    borderTopWidth: 1,
  },
})
