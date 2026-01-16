import React, {useEffect} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'
import {useNavigation} from '@react-navigation/native'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {type NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useSession} from '#/state/session'
import {IS_WEB} from '#/env'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'

export function CustomFeedEmptyState() {
  const feedFeedback = useFeedFeedbackContext()
  const {currentAccount} = useSession()
  const hasLoggedDiscoverEmptyErrorRef = React.useRef(false)

  useEffect(() => {
    // Log the empty feed error event
    if (feedFeedback.feedSourceInfo && currentAccount?.did) {
      const uri = feedFeedback.feedSourceInfo.uri
      if (
        uri === DISCOVER_FEED_URI &&
        !hasLoggedDiscoverEmptyErrorRef.current
      ) {
        hasLoggedDiscoverEmptyErrorRef.current = true
        logger.metric('feed:discover:emptyError', {
          userDid: currentAccount.did,
        })
      }
    }
  }, [feedFeedback.feedSourceInfo, currentAccount?.did])
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

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MagnifyingGlassIcon style={[styles.emptyIcon, pal.text]} size={62} />
      </View>
      <Text type="xl-medium" style={[s.textCenter, pal.text]}>
        <Trans>
          This feed is empty! You may need to follow more users or tune your
          language settings.
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
    </View>
  )
}
const styles = StyleSheet.create({
  emptyContainer: {
    height: '100%',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIcon: {
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

  feedsTip: {
    position: 'absolute',
    left: 22,
  },
  feedsTipArrow: {
    marginLeft: 32,
    marginTop: 8,
  },
})
