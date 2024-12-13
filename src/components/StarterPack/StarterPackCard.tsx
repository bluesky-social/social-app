import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyGraphDefs, AppBskyGraphStarterpack, AtUri} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeHandle} from '#/lib/strings/handles'
import {getStarterPackOgCard} from '#/lib/strings/starter-pack'
import {precacheResolvedUri} from '#/state/queries/resolve-uri'
import {precacheStarterPack} from '#/state/queries/starter-packs'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {StarterPack} from '#/components/icons/StarterPack'
import {Link as BaseLink, LinkProps as BaseLinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Default({
  starterPack,
}: {
  starterPack?: AppBskyGraphDefs.StarterPackViewBasic
}) {
  if (!starterPack) return null
  return (
    <Link starterPack={starterPack}>
      <Card starterPack={starterPack} />
    </Link>
  )
}

export function Notification({
  starterPack,
}: {
  starterPack?: AppBskyGraphDefs.StarterPackViewBasic
}) {
  if (!starterPack) return null
  return (
    <Link starterPack={starterPack}>
      <Card starterPack={starterPack} noIcon={true} noDescription={true} />
    </Link>
  )
}

export function Card({
  starterPack,
  noIcon,
  noDescription,
}: {
  starterPack: AppBskyGraphDefs.StarterPackViewBasic
  noIcon?: boolean
  noDescription?: boolean
}) {
  const {record, creator, joinedAllTimeCount} = starterPack

  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <View style={[a.w_full, a.gap_md]}>
      <View style={[a.flex_row, a.gap_sm, a.w_full]}>
        {!noIcon ? <StarterPack width={40} gradient="sky" /> : null}
        <View style={[a.flex_1]}>
          <Text
            emoji
            style={[a.text_md, a.font_bold, a.leading_snug]}
            numberOfLines={2}>
            {record.name}
          </Text>
          <Text
            emoji
            style={[a.leading_snug, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {creator?.did === currentAccount?.did
              ? _(msg`Starter pack by you`)
              : _(msg`Starter pack by ${sanitizeHandle(creator.handle, '@')}`)}
          </Text>
        </View>
      </View>
      {!noDescription && record.description ? (
        <Text emoji numberOfLines={3} style={[a.leading_snug]}>
          {record.description}
        </Text>
      ) : null}
      {!!joinedAllTimeCount && joinedAllTimeCount >= 50 && (
        <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
          {joinedAllTimeCount} users have joined!
        </Text>
      )}
    </View>
  )
}

export function Link({
  starterPack,
  children,
}: {
  starterPack: AppBskyGraphDefs.StarterPackViewBasic
  onPress?: () => void
  children: BaseLinkProps['children']
}) {
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const {record} = starterPack
  const {rkey, handleOrDid} = React.useMemo(() => {
    const rkey = new AtUri(starterPack.uri).rkey
    const {creator} = starterPack
    return {rkey, handleOrDid: creator.handle || creator.did}
  }, [starterPack])

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <BaseLink
      action="push"
      to={`/starter-pack/${handleOrDid}/${rkey}`}
      label={_(msg`Navigate to ${record.name}`)}
      onPress={() => {
        precacheResolvedUri(
          queryClient,
          starterPack.creator.handle,
          starterPack.creator.did,
        )
        precacheStarterPack(queryClient, starterPack)
      }}
      style={[a.flex_col, a.align_start]}>
      {children}
    </BaseLink>
  )
}

export function Embed({
  starterPack,
}: {
  starterPack: AppBskyGraphDefs.StarterPackViewBasic
}) {
  const t = useTheme()
  const imageUri = getStarterPackOgCard(starterPack)

  return (
    <View
      style={[
        a.border,
        a.rounded_sm,
        a.overflow_hidden,
        t.atoms.border_contrast_low,
      ]}>
      <Link starterPack={starterPack}>
        <Image
          source={imageUri}
          style={[a.w_full, {aspectRatio: 1.91}]}
          accessibilityIgnoresInvertColors={true}
        />
        <View style={[a.px_sm, a.py_md]}>
          <Card starterPack={starterPack} />
        </View>
      </Link>
    </View>
  )
}
