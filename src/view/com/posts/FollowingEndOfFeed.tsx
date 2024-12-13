import React from 'react'
import {Dimensions, StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'

export function FollowingEndOfFeed() {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const navigation = useNavigation<NavigationProp>()

  const onPressFindAccounts = React.useCallback(() => {
    if (isWeb) {
      navigation.navigate('Search', {})
    } else {
      navigation.navigate('SearchTab')
      navigation.popToTop()
    }
  }, [navigation])

  const onPressDiscoverFeeds = React.useCallback(() => {
    navigation.navigate('Feeds')
  }, [navigation])

  return (
    <View
      style={[
        styles.container,
        pal.border,
        {minHeight: Dimensions.get('window').height * 0.75},
      ]}>
      <View style={styles.inner}>
        <Text type="xl-medium" style={[s.textCenter, pal.text]}>
          <Trans>
            You've reached the end of your feed! Find some more accounts to
            follow.
          </Trans>
        </Text>
        <Button
          type="inverted"
          style={styles.emptyBtn}
          onPress={onPressFindAccounts}>
          <Text type="lg-medium" style={palInverted.text}>
            <Trans>Find accounts to follow</Trans>
          </Text>
          <FontAwesomeIcon
            icon="angle-right"
            style={palInverted.text as FontAwesomeIconStyle}
            size={14}
          />
        </Button>

        <Text type="xl-medium" style={[s.textCenter, pal.text, s.mt20]}>
          <Trans>You can also discover new Custom Feeds to follow.</Trans>
        </Text>
        <Button
          type="inverted"
          style={[styles.emptyBtn, s.mt10]}
          onPress={onPressDiscoverFeeds}>
          <Text type="lg-medium" style={palInverted.text}>
            <Trans>Discover new custom feeds</Trans>
          </Text>
          <FontAwesomeIcon
            icon="angle-right"
            style={palInverted.text as FontAwesomeIconStyle}
            size={14}
          />
        </Button>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 80,
    paddingHorizontal: 30,
    borderTopWidth: 1,
  },
  inner: {
    width: '100%',
    maxWidth: 460,
  },
  emptyBtn: {
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
})
