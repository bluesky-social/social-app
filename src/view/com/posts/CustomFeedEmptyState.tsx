import {useCallback, useEffect, useRef} from 'react'
import {StyleSheet, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {type NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {Text} from '../util/text/Text'

export function CustomFeedEmptyState() {
  const ax = useAnalytics()
  const feedFeedback = useFeedFeedbackContext()
  const {currentAccount} = useSession()
  const hasLoggedDiscoverEmptyErrorRef = useRef(false)

  useEffect(() => {
    // Log the empty feed error event
    if (feedFeedback.feedSourceInfo && currentAccount?.did) {
      const uri = feedFeedback.feedSourceInfo.uri
      if (
        uri === DISCOVER_FEED_URI &&
        !hasLoggedDiscoverEmptyErrorRef.current
      ) {
        hasLoggedDiscoverEmptyErrorRef.current = true
        ax.metric('feed:discover:emptyError', {
          userDid: currentAccount.did,
        })
      }
    }
  }, [feedFeedback.feedSourceInfo, currentAccount?.did])
  const {t: l} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressFindAccounts = useCallback(() => {
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
      <View style={[a.mt_xl, a.align_center]}>
        <Button
          label={l`Find accounts to follow`}
          onPress={onPressFindAccounts}
          color="secondary_inverted"
          size="large">
          <ButtonText>
            <Trans>Find accounts to follow</Trans>
          </ButtonText>
          <ButtonIcon icon={ChevronRightIcon} />
        </Button>
      </View>
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
})
