import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Button} from 'view/com/util/forms/Button'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {HomeTabNavigatorParams} from 'lib/routes/types'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'RecommendedFeeds'>
export const RecommendedFeeds = observer(({navigation}: Props) => {
  const pal = usePalette('default')
  const store = useStores()

  const next = () => {
    const nextScreenName = store.onboarding.nextScreenName()
    if (nextScreenName) {
      navigation.navigate(nextScreenName)
    }
  }

  return (
    <View style={[styles.container]}>
      <View testID="recommendedFeedsScreen">
        <Text type="lg-bold" style={[pal.text]}>
          Check out some recommended feeds. Click + to add them to your list of
          pinned feeds.
        </Text>
      </View>

      <Button
        onPress={next}
        label="Continue"
        testID="continueBtn"
        labelStyle={styles.buttonText}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 60,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 4,
  },
})
