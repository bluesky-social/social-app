import React from 'react'
import {View} from 'react-native'
import {AppBskyGraphStarterpack, AtUri} from '@atproto/api'
import {StarterPackViewBasic} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from 'lib/strings/handles'
import {isWeb} from 'platform/detection'
import {useSession} from 'state/session'
import {atoms as a, useTheme} from '#/alf'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function StarterPackCard({
  starterPack,
  type,
  hideTopBorder,
  hideBy,
}: {
  starterPack: StarterPackViewBasic
  hideTopBorder?: boolean
  type: 'list' | 'notification' | 'dialog'
  hideBy?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const {uri, record, creator, joinedAllTimeCount} = starterPack
  const rkey = new AtUri(uri).rkey

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <Link
      to={{
        screen: 'StarterPack',
        params: {name: creator.handle || creator.did, rkey},
      }}>
      <View
        style={[
          a.flex_row,
          a.w_full,
          a.px_xl,
          a.py_lg,
          a.gap_md,
          t.atoms.border_contrast_low,
          !hideTopBorder &&
            type !== 'notification' &&
            type !== 'dialog' &&
            a.border_t,
          (type === 'notification' || type === 'dialog') && [
            a.mt_sm,
            a.py_md,
            a.border,
            a.rounded_sm,
          ],
        ]}>
        {type !== 'notification' && <StarterPackIcon width={36} height={36} />}
        <View style={a.gap_xs}>
          <View style={[isWeb && a.gap_xs]}>
            <Text style={[a.font_bold, a.text_md]}>{record.name}</Text>
            {!hideBy && (
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>
                  Starter pack by{' '}
                  {creator?.did === currentAccount?.did
                    ? _(msg`you`)
                    : `@${sanitizeHandle(creator.handle)}`}
                </Trans>
              </Text>
            )}
          </View>
          {!!joinedAllTimeCount && joinedAllTimeCount >= 50 && (
            <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
              {joinedAllTimeCount} users have joined!
            </Text>
          )}
          {record.description && (
            <Text numberOfLines={3}>{record.description}</Text>
          )}
        </View>
      </View>
    </Link>
  )
}
