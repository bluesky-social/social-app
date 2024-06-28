import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {emitSoftReset} from '#/state/events'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {FeedSuggestedFollowsCards} from '#/components/FeedSuggestedFollows'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from '#/components/icons/ArrowRotateCounterClockwise'
import {Text} from '#/components/Typography'

export function EmptyTimeline() {
  const {_} = useLingui()

  return (
    <CenteredView sideBorders style={[a.h_full_vh]}>
      <View style={[a.px_lg, a.pt_3xl]}>
        <Text style={[a.text_2xl, a.font_bold, a.mb_md]}>
          <Trans>Your Following feed is empty :(</Trans>
        </Text>
        <Text style={[a.text_md, a.mb_sm, a.leading_snug]}>
          <Trans>
            Follow some users to see what's happening. Their content will appear
            here in chronological order.
          </Trans>
        </Text>
      </View>

      <View style={[a.flex_row, a.align_start]}>
        <FeedSuggestedFollowsCards />
      </View>
      <View style={[a.px_lg]}>
        <Divider />

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_end,
            a.pt_md,
            a.gap_md,
          ]}>
          <Text style={[a.leading_snug]}>
            <Trans>When you're done:</Trans>
          </Text>

          <Button
            label={_(msg`Click to refresh your following feed`)}
            size="small"
            variant="solid"
            color="secondary"
            onPress={() => emitSoftReset()}>
            <ButtonText>
              <Trans>Refresh your feed</Trans>
            </ButtonText>
            <ButtonIcon icon={Refresh} position="right" />
          </Button>
        </View>
      </View>
    </CenteredView>
  )
}
