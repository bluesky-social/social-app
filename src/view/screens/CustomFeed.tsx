import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import React, {useEffect, useMemo, useRef} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {useStores} from 'state/index'
import {AlgoItemModel} from 'state/models/feeds/algo/algo-item'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from 'view/com/posts/Feed'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {Text} from 'view/com/util/text/Text'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomFeed'>
export const CustomFeed = withAuthRequired(
  observer(({route}: Props) => {
    const rootStore = useStores()
    const scrollElRef = useRef<FlatList>(null)

    const {rkey, name} = route.params

    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(rootStore, 'custom', {
        feed: rkey,
      })
      feed.setup()
      return feed
    }, [rkey, rootStore])

    return (
      <View style={[styles.container]}>
        <ViewHeader title={'Custom Feed'} showOnDesktop />

        <Feed
          scrollElRef={scrollElRef}
          testID={'test-feed'}
          key="default"
          feed={algoFeed}
        />
      </View>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
})
