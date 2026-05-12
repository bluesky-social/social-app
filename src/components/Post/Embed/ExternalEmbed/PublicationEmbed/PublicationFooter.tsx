import {useEffect} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useProfileQuery} from '#/state/queries/profile'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type PublicationViewExternalSource} from './types'
import {parseDidFromAtUri} from './util'

export function PublicationFooter({
  source,
}: {
  source: PublicationViewExternalSource
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const did = parseDidFromAtUri(source.associatedRecord?.uri)
  const profileQuery = useProfileQuery({did: did ?? undefined})
  const profileError = profileQuery.error
  useEffect(() => {
    if (profileError && did) {
      // Log once per error transition. React Query handles transient network
      // failures via retry; once the error is set we don't want to re-log on
      // every render (could burn Sentry quota with a feed of broken DIDs).
      logger.error('PublicationEmbed handle resolve failed', {
        safeMessage: profileError,
      })
    }
  }, [profileError, did])
  const handle = did ? profileQuery.data?.handle : undefined

  const name = source.name || (source.uri ? toNiceDomain(source.uri) : '')

  const content = (hovered: boolean) => (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.px_md,
        a.py_md,
        a.transition_color,
        {gap: 10},
        hovered ? t.atoms.bg_contrast_25 : null,
      ]}
      testID="publication-embed-footer">
      <UserAvatar type="user" size={40} avatar={source.icon} />
      <View style={[a.flex_1, {minWidth: 0, gap: 2}]}>
        <Text
          numberOfLines={1}
          style={[a.text_sm, a.font_medium, t.atoms.text]}>
          {name}
        </Text>
        {handle && (
          <Text
            numberOfLines={1}
            testID="publication-embed-handle"
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            <Trans comment="Authorship line on the publication card. {handle} is a bsky handle.">
              by @{handle}
            </Trans>
          </Text>
        )}
      </View>
    </View>
  )

  if (!source.uri) {
    // No publication URL to link to; render the row as static content.
    return content(false)
  }

  return (
    <Link
      to={source.uri}
      label={
        source.name ? l`View publication: ${source.name}` : l`View publication`
      }
      shouldProxy>
      {({hovered}) => content(hovered)}
    </Link>
  )
}
