import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Button} from 'view/com/util/forms/Button'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {HomeTabNavigatorParams} from 'lib/routes/types'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {ViewHeader} from 'view/com/util/ViewHeader'

const TEMPORARY_RECOMMENDED_FEEDS = [
  {
    did: 'did:plc:hsqwcidfez66lwm3gxhfv5in',
    rkey: 'aaaf2pqeodmpy',
  },
  {
    did: 'did:plc:gekdk2nd47gkk3utfz2xf7cn',
    rkey: 'aaap4tbjcfe5y',
  },
  {
    did: 'did:plc:5rw2on4i56btlcajojaxwcat',
    rkey: 'aaao6g552b33o',
  },
  {
    did: 'did:plc:jfhpnnst6flqway4eaeqzj2a',
    rkey: 'for-science',
  },
  {
    did: 'did:plc:7q4nnnxawajbfaq7to5dpbsy',
    rkey: 'bsky-news',
  },
  {
    did: 'did:plc:jcoy7v3a2t4rcfdh6i4kza25',
    rkey: 'astro',
  },
  {
    did: 'did:plc:tenurhgjptubkk5zf5qhi3og',
    rkey: 'h-nba',
  },
  {
    did: 'did:plc:vpkhqolt662uhesyj6nxm7ys',
    rkey: 'devfeed',
  },
  {
    did: 'did:plc:cndfx4udwgvpjaakvxvh7wm5',
    rkey: 'flipboard-tech',
  },
  {
    did: 'did:plc:w4xbfzo7kqfes5zb7r6qv3rw',
    rkey: 'blacksky',
  },
  {
    did: 'did:plc:lptjvw6ut224kwrj7ub3sqbe',
    rkey: 'aaaotfjzjplna',
  },
  {
    did: 'did:plc:gkvpokm7ec5j5yxls6xk4e3z',
    rkey: 'formula-one',
  },
  {
    did: 'did:plc:q6gjnaw2blty4crticxkmujt',
    rkey: 'positivifeed',
  },
  {
    did: 'did:plc:l72uci4styb4jucsgcrrj5ap',
    rkey: 'aaao5dzfm36u4',
  },
  {
    did: 'did:plc:k3jkadxv5kkjgs6boyon7m6n',
    rkey: 'aaaavlyvqzst2',
  },
  {
    did: 'did:plc:nkahctfdi6bxk72umytfwghw',
    rkey: 'aaado2uvfsc6w',
  },
  {
    did: 'did:plc:epihigio3d7un7u3gpqiy5gv',
    rkey: 'aaaekwsc7zsvs',
  },
  {
    did: 'did:plc:qiknc4t5rq7yngvz7g4aezq7',
    rkey: 'aaaejxlobe474',
  },
  {
    did: 'did:plc:mlq4aycufcuolr7ax6sezpc4',
    rkey: 'aaaoudweck6uy',
  },
  {
    did: 'did:plc:rcez5hcvq3vzlu5x7xrjyccg',
    rkey: 'aaadzjxbcddzi',
  },
  {
    did: 'did:plc:lnxbuzaenlwjrncx6sc4cfdr',
    rkey: 'aaab2vesjtszc',
  },
  {
    did: 'did:plc:x3cya3wkt4n6u4ihmvpsc5if',
    rkey: 'aaacynbxwimok',
  },
  {
    did: 'did:plc:abv47bjgzjgoh3yrygwoi36x',
    rkey: 'aaagt6amuur5e',
  },
  {
    did: 'did:plc:ffkgesg3jsv2j7aagkzrtcvt',
    rkey: 'aaacjerk7gwek',
  },
  {
    did: 'did:plc:geoqe3qls5mwezckxxsewys2',
    rkey: 'aaai43yetqshu',
  },
  {
    did: 'did:plc:2wqomm3tjqbgktbrfwgvrw34',
    rkey: 'authors',
  },
]

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'RecommendedFeeds'>
export const RecommendedFeeds = observer(({navigation}: Props) => {
  const pal = usePalette('default')
  const store = useStores()

  const next = () => {
    const nextScreenName = store.onboarding.nextScreenName('RecommendedFeeds')
    if (nextScreenName) {
      navigation.navigate(nextScreenName)
    }
  }

  return (
    <View style={[styles.container]} testID="recommendedFeedsScreen">
      <ViewHeader title="Recommended Feeds" canGoBack />
      <Text type="lg-medium" style={[pal.text, styles.header]}>
        Check out some recommended feeds. Click + to add them to your list of
        pinned feeds.
      </Text>

      <FlatList
        data={TEMPORARY_RECOMMENDED_FEEDS}
        renderItem={({item}) => <Item item={item} />}
        keyExtractor={item => item.did + item.rkey}
        style={{flex: 1}}
      />

      <Button
        onPress={next}
        label="Continue"
        testID="continueBtn"
        style={styles.button}
        labelStyle={styles.buttonText}
      />
    </View>
  )
})

type ItemProps = {
  did: string
  rkey: string
}

const Item = ({item}: {item: ItemProps}) => {
  const uri = makeRecordUri(item.did, 'app.bsky.feed.generator', item.rkey)
  const data = useCustomFeed(uri)
  if (!data) return null
  return (
    <CustomFeed item={data} key={uri} showDescription showLikes showSaveBtn />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 48,
    marginTop: 16,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 4,
  },
})
