import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'

export type ValuePropositionPagerProps = {
  step: 0 | 1 | 2
  /**
   * Only the native pager changes pages itself (by swiping); the web pager
   * is driven entirely by the step prop.
   */
  setStep: (step: 0 | 1 | 2) => void
  avatarUri?: string
}

export function useValuePropText(step: 0 | 1 | 2) {
  const {t: l} = useLingui()

  return [
    {
      title: l`Free your feed`,
      description: l`No more doomscrolling junk-filled algorithms. Find feeds that work for you, not against you.`,
      alt: l`A collection of popular feeds you can find on Bluesky, including News, Booksky, Game Dev, Blacksky, and Fountain Pens`,
    },
    {
      title: l`Find your people`,
      description: l`Ditch the trolls and clickbait. Find real people and conversations that matter to you.`,
      alt: l`Your profile picture surrounded by concentric circles of other users' profile pictures`,
    },
    {
      title: l`Forget the noise`,
      description: l`No ads, no invasive tracking, no engagement traps. Bluesky respects your time and attention.`,
      alt: l`An illustration of several Bluesky posts alongside repost, like, and comment icons`,
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
