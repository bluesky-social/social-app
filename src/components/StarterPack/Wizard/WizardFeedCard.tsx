import React from 'react'
import {Keyboard, View} from 'react-native'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {UserAvatar} from 'view/com/util/UserAvatar'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WizardFeedCard({
  generator,
  state,
  dispatch,
}: {
  generator: GeneratorView
  state: WizardState
  dispatch: (action: WizardAction) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  const includesFeed = state.feeds.some(f => f.uri === generator.uri)
  const onAdd = () => {
    Keyboard.dismiss()
    if (includesFeed) {
      dispatch({type: 'RemoveFeed', feedUri: generator.uri})
    } else {
      dispatch({type: 'AddFeed', feed: generator})
    }
  }

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.px_md,
        a.py_sm,
        a.border_b,
        a.gap_md,
        t.atoms.border_contrast_low,
      ]}>
      <UserAvatar type="algo" size={45} avatar={generator.avatar} />
      <View style={[a.flex_1]}>
        <Text style={[a.flex_1, a.font_bold, a.text_md]} numberOfLines={1}>
          {generator.displayName}
        </Text>
        <Text
          style={[a.flex_1, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {_(msg`Feed by @${generator.creator.handle}`)}
        </Text>
      </View>
      <Button
        label={includesFeed ? _(msg`Remove`) : _(msg`Add`)}
        variant="solid"
        color={includesFeed ? 'secondary' : 'primary'}
        size="small"
        style={{paddingVertical: 6}}
        onPress={onAdd}>
        <ButtonText>
          {includesFeed ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
