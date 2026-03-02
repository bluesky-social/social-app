import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'

export function useValuePropText(step: 0 | 1 | 2) {
  const {_} = useLingui()

  return [
    {
      title: _(msg`Free your feed`),
      description: _(
        msg`No more doomscrolling junk-filled algorithms. Find feeds that work for you, not against you.`,
      ),
      alt: _(
        msg`A collection of popular feeds you can find on Bluesky, including News, Booksky, Game Dev, Blacksky, and Fountain Pens`,
      ),
    },
    {
      title: _(msg`Find your people`),
      description: _(
        msg`Ditch the trolls and clickbait. Find real people and conversations that matter to you.`,
      ),
      alt: _(
        msg`Your profile picture surrounded by concentric circles of other users' profile pictures`,
      ),
    },
    {
      title: _(msg`Forget the noise`),
      description: _(
        msg`No ads, no invasive tracking, no engagement traps. Bluesky respects your time and attention.`,
      ),
      alt: _(
        msg`An illustration of several Bluesky posts alongside repost, like, and comment icons`,
      ),
    },
  ][step]
}

export function Dot({active}: {active: boolean}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_full,
        {width: 8, height: 8},
        active
          ? {backgroundColor: t.palette.primary_500}
          : t.atoms.bg_contrast_50,
      ]}
    />
  )
}
