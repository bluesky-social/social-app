import {View} from 'react-native'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {getActorBadges, KNOWN_BADGES} from '#/lib/badges'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {
  type BadgeCardProps,
  CommunityBuilderCard,
  FinancialSupporter1Card,
  FinancialSupporter2Card,
  FinancialSupporter3Card,
  PeerModeratorCard,
  TechSupportCard,
} from './art'

type BadgeDef = {
  label: MessageDescriptor
  description: MessageDescriptor
  Card: (props: BadgeCardProps) => React.ReactNode
}

export const BADGE_REGISTRY: Record<string, BadgeDef> = {
  'peer-moderator': {
    label: msg`Peer Moderator`,
    description: msg`This account is a Blacksky community peer moderator. Peer moderators help keep the community safe by applying labels and reviewing reports alongside the core Blacksky team.`,
    Card: PeerModeratorCard,
  },
  'community-builder': {
    label: msg`Community Builder`,
    description: msg`This account has made outstanding contributions to building the Blacksky community.`,
    Card: CommunityBuilderCard,
  },
  'financial-supporter-1': {
    label: msg`Financial Supporter`,
    description: msg`This account financially supports Blacksky, helping keep the community independent and thriving.`,
    Card: FinancialSupporter1Card,
  },
  'financial-supporter-2': {
    label: msg`Financial Supporter`,
    description: msg`This account financially supports Blacksky, helping keep the community independent and thriving.`,
    Card: FinancialSupporter2Card,
  },
  'financial-supporter-3': {
    label: msg`Financial Supporter`,
    description: msg`This account financially supports Blacksky, helping keep the community independent and thriving.`,
    Card: FinancialSupporter3Card,
  },
  'tech-support': {
    label: msg`Tech Support`,
    description: msg`This account provides technical support to the Blacksky community.`,
    Card: TechSupportCard,
  },
}

function knownBadgesFor(profile: bsky.profile.AnyProfileView): string[] {
  return getActorBadges(profile).filter(b => KNOWN_BADGES.has(b))
}

export function ActorBadges({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const badges = knownBadgesFor(profile)
  if (badges.length === 0) return null
  return (
    <>
      {badges.map(slug => {
        const {Card} = BADGE_REGISTRY[slug]
        return (
          <View key={slug}>
            <Card width={width} />
          </View>
        )
      })}
    </>
  )
}

export function ActorBadgeButtons({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const badges = knownBadgesFor(profile)
  if (badges.length === 0) return null
  return (
    <>
      {badges.map(slug => (
        <BadgeButton key={slug} slug={slug} width={width} />
      ))}
    </>
  )
}

function BadgeButton({slug, width}: {slug: string; width: number}) {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const {label, Card} = BADGE_REGISTRY[slug]
  return (
    <>
      <Button
        label={_(label)}
        hitSlop={20}
        onPress={evt => {
          evt.preventDefault()
          control.open()
        }}>
        {({hovered}) => (
          <View
            style={[
              a.justify_center,
              a.align_center,
              a.transition_transform,
              {
                width,
                height: width,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <Card width={width} />
          </View>
        )}
      </Button>
      <BadgeDialog control={control} slug={slug} />
    </>
  )
}

function BadgeDialog({
  control,
  slug,
}: {
  control: Dialog.DialogControlProps
  slug: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {label, description, Card} = BADGE_REGISTRY[slug]
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(label)}>
        <View style={[a.gap_md]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Card width={36} />
            <Text style={[a.text_xl, a.font_bold]}>{_(label)}</Text>
          </View>
          <Text style={[t.atoms.text_contrast_high, a.text_md, a.leading_snug]}>
            {_(description)}
          </Text>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
