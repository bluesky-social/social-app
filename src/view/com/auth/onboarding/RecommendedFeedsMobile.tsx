import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Button} from 'view/com/util/forms/Button'
import {observer} from 'mobx-react-lite'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {isDesktopWeb} from 'platform/detection'
import {RECOMMENDED_FEEDS} from 'lib/constants'

type Props = {
  next: () => void
}
export const RecommendedFeedsMobile = observer(({next}: Props) => {
  const pal = usePalette('default')

  return (
    <View style={[styles.container]} testID="recommendedFeedsScreen">
      <ViewHeader
        title="Recommended Feeds"
        showBackButton={false}
        showOnDesktop
      />
      <Text type="lg-medium" style={[pal.text, styles.header]}>
        Check out some recommended feeds. Tap + to add them to your list of
        pinned feeds.
      </Text>

      <FlatList
        data={RECOMMENDED_FEEDS}
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
    <CustomFeed
      item={data}
      key={uri}
      showDescription
      showLikes
      showSaveBtn
      style={[
        {
          // @ts-ignore
          cursor: isDesktopWeb ? 'pointer' : 'auto',
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  button: {
    marginBottom: 24,
    marginHorizontal: 16,
    marginTop: 16,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 4,
  },
})
