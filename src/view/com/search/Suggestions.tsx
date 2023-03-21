import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FoafsModel} from 'state/models/discovery/foafs'
import {WhoToFollow} from 'view/com/discover/WhoToFollow'
import {SuggestedFollows} from 'view/com/discover/SuggestedFollows'
import {ProfileCardFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'

export const Suggestions = observer(({foafs}: {foafs: FoafsModel}) => {
  if (foafs.isLoading) {
    return <ProfileCardFeedLoadingPlaceholder />
  }
  if (foafs.hasContent) {
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
        <WhoToFollow />
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
  }
  return <WhoToFollow />
})

const styles = StyleSheet.create({
  suggestions: {
    marginTop: 10,
    marginBottom: 20,
  },
})
