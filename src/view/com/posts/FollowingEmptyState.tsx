import React from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {type NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {IS_WEB} from '#/env'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'

export function FollowingEmptyState() {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const navigation = useNavigation<NavigationProp>()

  const onPressFindAccounts = React.useCallback(() => {
    if (IS_WEB) {
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
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconContainer}>
          <MagnifyingGlassIcon style={[styles.icon, pal.text]} size={62} />
        </View>
        <Text type="xl-medium" style={[s.textCenter, pal.text]}>
          <Trans>
            Your following feed is empty! Follow more users to see what's
            happening.
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
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  inner: {
    width: '100%',
    maxWidth: 460,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    marginLeft: 'auto',
    marginRight: 'auto',
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
