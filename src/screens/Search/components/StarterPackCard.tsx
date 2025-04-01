import React from 'react'
import {View} from 'react-native'
import {AppBskyGraphDefs} from '@atproto/api'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

import {getStarterPackOgCard} from '#/lib/strings/starter-pack'
import * as Card from '#/components/StarterPack/StarterPackCard'
import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export function StarterPackCard({view}: {view: AppBskyGraphDefs.StarterPackViewBasic}) {
  const t = useTheme()
  const {_} = useLingui()
  const imageUri = getStarterPackOgCard(view)
  const {gtPhone} = useBreakpoints()

  return (
    <View
      style={[
        a.border,
        a.rounded_sm,
        a.overflow_hidden,
        t.atoms.border_contrast_low,
      ]}>
      <Card.Link starterPack={view}>
        <View style={[a.w_full, gtPhone && [
          a.flex_row, a.gap_lg,
        ]]}>
          <View style={[gtPhone && {
            width: '50%',
          }]}>
            <Image
              source={imageUri}
              style={[a.w_full, {aspectRatio: 1.91}]}
              accessibilityIgnoresInvertColors={true}
            />
          </View>
          <View style={[a.flex_1, a.py_md, a.pr_md, !gtPhone && [a.px_md, a.flex_row, a.gap_sm, a.align_start]]}>
            <View style={[a.flex_1]}>
              <Card.Card starterPack={view} noIcon />
            </View>
            <Button
              label={_(msg`Open pack`)}
              variant='solid'
              color='secondary'
              size='small'
            >
              <ButtonText><Trans>Open pack</Trans></ButtonText>
            </Button>
          </View>
        </View>
      </Card.Link>
    </View>
  )
}
