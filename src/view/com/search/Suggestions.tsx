import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FoafsModel} from 'state/models/discovery/foafs'
import {SuggestedActorsModel} from 'state/models/discovery/suggested-actors'
import {SuggestedFollows} from 'view/com/discover/SuggestedFollows'
import {ProfileCardFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'

export const Suggestions = observer(
  ({
    foafs,
    suggestedActors,
  }: {
    foafs: FoafsModel
    suggestedActors: SuggestedActorsModel
  }) => {
    if (foafs.isLoading || suggestedActors.isLoading) {
      return <ProfileCardFeedLoadingPlaceholder />
    }
    return (
      <>
        {foafs.popular.length > 0 && (
          <View style={styles.suggestions}>
            <SuggestedFollows
              title="In your network"
              suggestions={foafs.popular}
            />
          </View>
        )}
        {suggestedActors.hasContent && (
          <View style={styles.suggestions}>
            <SuggestedFollows
              title="Suggested follows"
              suggestions={suggestedActors.suggestions}
            />
          </View>
        )}
        {foafs.sources.map((source, i) => {
          const item = foafs.foafs.get(source)
          if (!item || item.follows.length === 0) {
            return <View key={`sf-${item?.did || i}`} />
          }
          return (
            <View key={`sf-${item.did}`} style={styles.suggestions}>
              <SuggestedFollows
                title={`Followed by ${item.displayName || item.handle}`}
                suggestions={item.follows.slice(0, 10)}
              />
            </View>
          )
        })}
      </>
    )
  },
)

const styles = StyleSheet.create({
  suggestions: {
    marginTop: 10,
    marginBottom: 20,
  },
})
