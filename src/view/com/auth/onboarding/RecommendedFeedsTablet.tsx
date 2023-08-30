import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {Button} from 'view/com/util/forms/Button'
import {RecommendedFeedsItem} from './RecommendedFeedsItem'
import {usePalette} from 'lib/hooks/usePalette'
import {RECOMMENDED_FEEDS} from 'lib/constants'

type Props = {
  next: () => void
}
export const RecommendedFeedsTablet = observer(({next}: Props) => {
  const pal = usePalette('default')

  const title = (
    <>
      <Text style={[pal.textLight, styles.title1]}>Choose your</Text>
      <Text style={[pal.link, styles.title2]}>Recomended</Text>
      <Text style={[pal.link, styles.title2]}>Feeds</Text>
      <Text type="2xl-medium" style={[pal.textLight, styles.description]}>
        Feeds are created by users to curate content. Choose some feeds that you
        find interesting.
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 20,
        }}>
        <Button onPress={next} testID="continueBtn">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 2,
              gap: 6,
            }}>
            <Text
              type="2xl-medium"
              style={{color: '#fff', position: 'relative', top: -1}}>
              Done
            </Text>
            <FontAwesomeIcon icon="angle-right" color="#fff" size={14} />
          </View>
        </Button>
      </View>
    </>
  )

  return (
    <TitleColumnLayout
      testID="recommendedFeedsScreen"
      title={title}
      horizontal
      contentStyle={{paddingHorizontal: 0}}>
      <FlatList
        data={RECOMMENDED_FEEDS}
        renderItem={({item}) => <RecommendedFeedsItem {...item} />}
        keyExtractor={item => item.did + item.rkey}
        style={{flex: 1}}
      />
    </TitleColumnLayout>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  title1: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  title2: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'right',
  },
  description: {
    maxWidth: 400,
    marginTop: 10,
    marginLeft: 'auto',
    textAlign: 'right',
  },
})
