import {useCallback} from 'react'
import {Dimensions, StyleSheet, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {type NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {IS_WEB} from '#/env'
import {Text} from '../util/text/Text'

export function FollowingEndOfFeed() {
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

  const onPressDiscoverFeeds = useCallback(() => {
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

        <Text type="xl-medium" style={[s.textCenter, pal.text, s.mt20]}>
          <Trans>You can also discover new Custom Feeds to follow.</Trans>
        </Text>
        <View style={[a.mt_md, a.align_center]}>
          <Button
            label={l`Discover new custom feeds`}
            onPress={onPressDiscoverFeeds}
            color="secondary_inverted"
            size="large">
            <ButtonText>
              <Trans>Discover new custom feeds</Trans>
            </ButtonText>
            <ButtonIcon icon={ChevronRightIcon} />
          </Button>
        </View>
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
})
