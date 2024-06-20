import React from 'react'
import {View} from 'react-native'
import {AppBskyGraphStarterpack, AtUri} from '@atproto/api'
import {StarterPackViewBasic} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from 'lib/strings/handles'
import {useSession} from 'state/session'
import {atoms as a, useTheme} from '#/alf'
import {StarterPack} from '#/components/icons/StarterPack'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Default({starterPack}: {starterPack: StarterPackViewBasic}) {
  const {record} = starterPack

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <Link starterPack={starterPack} label={record.name}>
      <Card starterPack={starterPack} />
    </Link>
  )
}

export function Card({starterPack}: {starterPack: StarterPackViewBasic}) {
  const {record, creator, joinedAllTimeCount} = starterPack

  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <View style={[a.flex_1, a.gap_md]}>
      <View style={[a.flex_row, a.gap_sm]}>
        <StarterPack width={40} gradient="sky" />
        <View>
          <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
            {record.name}
          </Text>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Starter pack by{' '}
              {creator?.did === currentAccount?.did
                ? _(msg`you`)
                : `@${sanitizeHandle(creator.handle)}`}
            </Trans>
          </Text>
        </View>
      </View>
      {record.description && (
        <Text numberOfLines={3} style={[a.leading_snug]}>
          {record.description}
        </Text>
      )}
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
  ...rest
}: {
  starterPack: StarterPackViewBasic
} & Omit<LinkProps, 'to'>) {
  const {rkey, handleOrDid} = React.useMemo(() => {
    const rkey = new AtUri(starterPack.uri).rkey
    const {creator} = starterPack
    return {rkey, handleOrDid: creator.handle || creator.did}
  }, [starterPack])
  return (
    <InternalLink
      label={
        AppBskyGraphStarterpack.isRecord(starterPack.record)
          ? starterPack.record.name
          : undefined
      }
      {...rest}
      to={{
        screen: 'StarterPack',
        params: {name: handleOrDid, rkey},
      }}>
      {children}
    </InternalLink>
  )
}
