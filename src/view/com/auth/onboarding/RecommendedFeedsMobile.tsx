import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Text} from 'view/com/util/text/Text'
import {Button} from 'view/com/util/forms/Button'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {RecommendedFeedsItem} from './RecommendedFeedsItem'
import {usePalette} from 'lib/hooks/usePalette'
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
        renderItem={({item}) => <RecommendedFeedsItem {...item} />}
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
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 4,
  },
})
