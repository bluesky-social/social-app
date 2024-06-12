import React from 'react'
import {Keyboard, Pressable, View} from 'react-native'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from 'platform/detection'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Checkbox} from '#/components/forms/Toggle'
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
  const onPressAddRemove = () => {
    Keyboard.dismiss()
    if (includesFeed) {
      dispatch({type: 'RemoveFeed', feedUri: generator.uri})
    } else {
      dispatch({type: 'AddFeed', feed: generator})
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        a.flex_row,
        a.align_center,
        a.px_md,
        a.py_sm,
        a.gap_md,
        a.border_b,
        t.atoms.border_contrast_low,
        // @ts-expect-error web only
        isWeb && {
          cursor: 'default',
        },
      ]}
      onPress={onPressAddRemove}>
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
      <Toggle.Item
        name={_(msg`Person toggle`)}
        label={
          includesFeed
            ? _(msg`Remove ${generator.displayName} from starter pack`)
            : _(msg`Add ${generator.displayName} to starter pack`)
        }
        value={includesFeed}
        onChange={onPressAddRemove}>
        <Checkbox />
      </Toggle.Item>
    </Pressable>
  )
}
