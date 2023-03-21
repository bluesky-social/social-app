import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {SuggestedActorsViewModel} from 'state/models/suggested-actors-view'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {Text} from '../util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'

export const WhoToFollow = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const suggestedActorsView = React.useMemo<SuggestedActorsViewModel>(
    () => new SuggestedActorsViewModel(store, {pageSize: 15}),
    [store],
  )

  React.useEffect(() => {
    suggestedActorsView.loadMore(true)
  }, [store, suggestedActorsView])

  return (
    <>
      {(suggestedActorsView.hasContent || suggestedActorsView.isLoading) && (
        <Text type="title" style={[styles.heading, pal.text]}>
          Who to follow
        </Text>
      )}
      {suggestedActorsView.hasContent && (
        <>
          <View style={[pal.border, styles.bottomBorder]}>
            {suggestedActorsView.suggestions.map(item => (
              <ProfileCardWithFollowBtn
                key={item.did}
                did={item.did}
                declarationCid={item.declaration.cid}
                handle={item.handle}
                displayName={item.displayName}
                avatar={item.avatar}
                description={item.description}
              />
            ))}
          </View>
        </>
      )}
      {suggestedActorsView.isLoading && (
        <View style={s.mt10}>
          <ActivityIndicator />
        </View>
      )}
    </>
  )
})

const styles = StyleSheet.create({
  heading: {
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  bottomBorder: {
    borderBottomWidth: 1,
  },
})
