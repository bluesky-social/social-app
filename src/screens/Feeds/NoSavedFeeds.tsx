import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {RECOMMENDED_SAVED_FEEDS} from '#/lib/constants'
import {useAddSavedFeedsMutation} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Text} from '#/components/Typography'

export function NoSavedFeeds() {
  const t = useTheme()
  const {_} = useLingui()
  const {isPending, mutateAsync: addSavedFeeds} = useAddSavedFeedsMutation()

  const addRecommendedFeeds = React.useCallback(async () => {
    await addSavedFeeds(RECOMMENDED_SAVED_FEEDS)
  }, [addSavedFeeds])

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
