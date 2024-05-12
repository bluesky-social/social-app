import React from 'react'
import {View} from 'react-native'
import {TID} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {RECOMMENDED_SAVED_FEEDS} from '#/lib/constants'
import {useOverwriteSavedFeedsMutation} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Text} from '#/components/Typography'

/**
 * Explicitly named, since the CTA in this component will overwrite all saved
 * feeds if pressed. It should only be presented to the user if they actually
 * have no other feeds saved.
 */
export function NoSavedFeedsOfAnyType() {
  const t = useTheme()
  const {_} = useLingui()
  const {isPending, mutateAsync: overwriteSavedFeeds} =
    useOverwriteSavedFeedsMutation()

  const addRecommendedFeeds = React.useCallback(async () => {
    await overwriteSavedFeeds(
      RECOMMENDED_SAVED_FEEDS.map(f => ({
        ...f,
        id: TID.nextStr(),
      })),
    )
  }, [overwriteSavedFeeds])

  return (
    <View
      style={[a.flex_row, a.flex_wrap, a.justify_between, a.p_xl, a.gap_md]}>
      <Text
        style={[a.leading_snug, t.atoms.text_contrast_medium, {maxWidth: 310}]}>
        <Trans>
          Looks like you haven't saved any feeds! Use our recommendations or
          browse more below.
        </Trans>
      </Text>

      <Button
        disabled={isPending}
        label={_(msg`Apply default recommended feeds`)}
        size="small"
        variant="solid"
        color="primary"
        onPress={addRecommendedFeeds}>
        <ButtonIcon icon={Plus} position="left" />
        <ButtonText>{_(msg`Use recommended`)}</ButtonText>
      </Button>
    </View>
  )
}
