import React, {forwardRef, ForwardedRef} from 'react'
import {RefreshControl, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs} from '@atproto/api'
import {FlatList} from '../util/Views'
import {FoafsModel} from 'state/models/discovery/foafs'
import {
  SuggestedActorsModel,
  SuggestedActor,
} from 'state/models/discovery/suggested-actors'
import {Text} from '../util/text/Text'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ProfileCardLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {RefWithInfoAndFollowers} from 'state/models/discovery/foafs'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'

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
interface LoadingPlaceholder {
  _reactKey: string
  type: 'loading-placeholder'
}
type Item =
  | Heading
  | RefWrapper
  | SuggestWrapper
  | ProfileView
  | LoadingPlaceholder

// FIXME(dan): Figure out why the false positives
/* eslint-disable react/prop-types */

export const Suggestions = observer(
  forwardRef(function SuggestionsImpl(
    {
      foafs,
      suggestedActors,
    }: {
      foafs: FoafsModel
      suggestedActors: SuggestedActorsModel
    },
    flatListRef: ForwardedRef<FlatList>,
  ) {
    const pal = usePalette('default')
    const [refreshing, setRefreshing] = React.useState(false)
    const data = React.useMemo(() => {
      let items: Item[] = []

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
      } else if (suggestedActors.isLoading) {
        items = items.concat([
          {
            _reactKey: '__suggested_heading__',
            type: 'heading',
            title: 'Suggested Follows',
          },
          {_reactKey: '__suggested_loading__', type: 'loading-placeholder'},
        ])
      }
      if (foafs.isLoading) {
        items = items.concat([
          {
            _reactKey: '__popular_heading__',
            type: 'heading',
            title: 'In Your Network',
          },
          {_reactKey: '__foafs_loading__', type: 'loading-placeholder'},
        ])
      } else {
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
                  item.displayName || sanitizeHandle(item.handle),
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
      }

      return items
    }, [
      foafs.isLoading,
      foafs.popular,
      suggestedActors.isLoading,
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
        if (item.type === 'loading-placeholder') {
          return (
            <View>
              <ProfileCardLoadingPlaceholder />
              <ProfileCardLoadingPlaceholder />
              <ProfileCardLoadingPlaceholder />
              <ProfileCardLoadingPlaceholder />
            </View>
          )
        }
        return null
      },
      [pal],
    )

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
        contentContainerStyle={s.contentContainer}
      />
    )
  }),
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
