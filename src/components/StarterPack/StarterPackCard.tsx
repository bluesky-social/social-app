import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, AppBskyGraphStarterpack, AtUri} from '@atproto/api'
import {StarterPackViewBasic} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from 'lib/strings/handles'
import {useSession} from 'state/session'
import {atoms as a, useTheme} from '#/alf'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Default({starterPack}: {starterPack: StarterPackViewBasic}) {
  const rkey = new AtUri(starterPack.uri).rkey
  const {record, creator, joinedAllTimeCount} = starterPack

  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <Wrapper creator={starterPack.creator} rkey={rkey}>
      <View style={[a.flex_row, a.gap_md]}>
        <StarterPackIcon width={36} height={36} />
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
        <Text numberOfLines={3}>{record.description}</Text>
      )}
      {!!joinedAllTimeCount && joinedAllTimeCount >= 50 && (
        <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
          {joinedAllTimeCount} users have joined!
        </Text>
      )}
    </Wrapper>
  )
}

function Wrapper({
  creator,
  children,
  rkey,
}: {
  creator: AppBskyActorDefs.ProfileViewBasic
  rkey: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={{
        screen: 'StarterPack',
        params: {name: creator.handle || creator.did, rkey},
      }}>
      <View style={[a.flex_1, a.gap_md]}>{children}</View>
    </Link>
  )
}
