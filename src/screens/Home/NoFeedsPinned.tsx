import React from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {RECOMMENDED_SAVED_FEEDS} from '#/lib/constants'
import {useAddSavedFeedsMutation} from '#/state/queries/preferences'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop || isTablet) {
    return 0
  }
  const navBarHeight = 42
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 1.2
  const tabBarText = 16 * normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText
}

export function NoFeedsPinned() {
  const {_} = useLingui()
  const headerOffset = useHeaderOffset()
  const {isPending, mutateAsync: addSavedFeeds} = useAddSavedFeedsMutation()

  const addRecommendedFeeds = React.useCallback(async () => {
    await addSavedFeeds(RECOMMENDED_SAVED_FEEDS)
  }, [addSavedFeeds])

  return (
    <CenteredView sideBorders style={[a.h_full_vh]}>
      <View
        style={[
          a.align_center,
          a.h_full_vh,
          a.py_3xl,
          a.px_xl,
          {
            paddingTop: headerOffset + a.py_3xl.paddingTop,
          },
        ]}>
        <View style={[a.align_center, a.gap_sm, a.pb_xl]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Whoops!</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, a.leading_snug, {maxWidth: 340}]}>
            <Trans>
              Looks like you unpinned all your feeds. But don't worry, you can
              add some below 😄
            </Trans>
          </Text>
        </View>

        <View style={[a.flex_row, a.gap_md, a.justify_center, a.flex_wrap]}>
          <Button
            disabled={isPending}
            label={_(msg`Apply default recommended feeds`)}
            size="medium"
            variant="solid"
            color="primary"
            onPress={addRecommendedFeeds}>
            <ButtonIcon icon={Plus} position="left" />
            <ButtonText>{_(msg`Add recommended feeds`)}</ButtonText>
          </Button>

          <Link
            label={_(msg`Browse other feeds`)}
            to="/feeds"
            size="medium"
            variant="solid"
            color="secondary">
            <ButtonIcon icon={ListSparkle} position="left" />
            <ButtonText>{_(msg`Browse other feeds`)}</ButtonText>
          </Link>
        </View>
      </View>
    </CenteredView>
  )
}
