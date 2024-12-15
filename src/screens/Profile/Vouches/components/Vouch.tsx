import React from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyGraphVouch,
} from '@atproto/api'
import {msg,Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useRevokeVouch} from '#/state/queries/vouches/useRevokeVouch'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useGutters,useTheme} from '#/alf'
import {Button, ButtonIcon,ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function Vouch({
  vouch,
  subject,
}: {
  vouch: AppBskyGraphDefs.VouchView
  subject: AppBskyActorDefs.ProfileViewBasic
}) {
  const t = useTheme()
  const record = vouch.record
  const ago = useGetTimeAgo()

  if (!AppBskyGraphVouch.isRecord(record)) return null

  return (
    <View
      style={[
        a.p_sm,
        a.rounded_md,
        a.flex_1,
        a.gap_sm,
        t.atoms.bg_contrast_25,
        {
          width: 240,
        },
      ]}>
      <View style={[a.flex_row, a.align_start, a.gap_sm]}>
        <UserAvatar size={32} avatar={subject.avatar} />
        <View style={[a.gap_2xs]}>
          <Text style={[a.text_md, a.font_bold, a.leading_tight]}>
            @{subject.handle}
          </Text>
          <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>
            {record.relationship}
          </Text>
        </View>
      </View>
      <Divider />
      <View style={[a.flex_row, a.align_start, a.justify_between, a.gap_xl]}>
        <Text style={[a.text_xs, a.font_bold, a.leading_tight]}>
          {vouch.accept ? 'Accepted' : 'Pending'}
        </Text>
        <Text style={[a.text_xs, a.leading_tight]}>
          <Trans>{ago(record.createdAt, new Date())} ago</Trans>
        </Text>
      </View>
    </View>
  )
}

export function VouchList({
  vouch,
  subject,
  first,
}: {
  vouch: AppBskyGraphDefs.VouchView
  subject: AppBskyActorDefs.ProfileViewBasic
  first?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const record = vouch.record as AppBskyGraphVouch.Record
  const ago = useGetTimeAgo()
  const gutters = useGutters(['compact', 'base'])
  const relationship = useRelationshipLabel(record.relationship)
  const {mutateAsync, isPending} = useRevokeVouch()

  const revoke = React.useCallback(async () => {
    try {
      await mutateAsync({vouch})
      Toast.show(_(msg`Vouch revoked`), 'check')
    } catch (e: any) {
      Toast.show(_(msg`Failed to revoke vouch`), 'xmark')
    }
  }, [_, vouch, mutateAsync])

  return (
    <View
      style={[
        gutters,
        a.w_full,
        !first && a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
        <UserAvatar size={40} avatar={subject.avatar} />

        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.text_md, a.font_bold, a.leading_tight]}>
            @{subject.handle}
          </Text>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <View
              style={[
                a.rounded_xs,
                t.atoms.bg_contrast_25,
                {
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                },
              ]}>
              <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>
                {relationship}
              </Text>
            </View>
            <View
              style={[
                a.rounded_xs,
                t.atoms.bg_contrast_25,
                {
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                },
              ]}>
              <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>
                {vouch.accept ? _(msg`Accepted`) : _(msg`Pending`)}
              </Text>
            </View>
            <Text style={[a.text_sm, a.leading_tight]}>
              <Trans>Issued: {ago(record.createdAt, new Date())} ago</Trans>
            </Text>
          </View>
        </View>

        <Button
          disabled={isPending}
          label={_(msg`Revoke vouch from ${subject.handle}`)}
          size="small"
          variant="solid"
          color="secondary"
          onPress={revoke}>
          <ButtonText>
            <Trans>Revoke</Trans>
          </ButtonText>
          <ButtonIcon icon={isPending ? Loader : Times} position="right" />
        </Button>
      </View>
    </View>
  )
}

function useRelationshipLabel(
  relationship: AppBskyGraphVouch.Record['relationship'],
) {
  const {_} = useLingui()

  return React.useMemo(() => {
    switch (relationship) {
      case 'verifiedBy':
        return _(msg`Bopped`)
      case 'employeeOf':
        return _(msg`Beeped`)
      default:
        return _(msg`Unknown`)
    }
  }, [_, relationship])
}
