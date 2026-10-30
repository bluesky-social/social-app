import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type ActivityActor} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'

/** Matches notification names, including moderation and the handle fallback. */
export function useActivityDisplayName(actor?: ActivityActor) {
  const opts = useModerationOpts()
  const moderation = actor && opts ? moderateProfile(actor, opts) : undefined
  return actor
    ? sanitizeDisplayName(
        actor.displayName || '',
        moderation?.ui('displayName'),
      ) || sanitizeHandle(actor.handle)
    : ''
}

export function ActivityHandle({actor}: {actor?: ActivityActor}) {
  const t = useTheme()
  const {t: l} = useLingui()
  if (!actor) return null
  const handle = sanitizeHandle(actor.handle, '@')

  return (
    <InlineLinkText
      to={makeProfileLink(actor)}
      label={l`View ${handle}’s profile`}
      numberOfLines={1}
      style={[a.self_start, a.text_sm, t.atoms.text_contrast_medium]}>
      {handle}
    </InlineLinkText>
  )
}

export function ActivityByline({
  actor,
  testID,
}: {
  actor?: ActivityActor
  testID?: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const name = useActivityDisplayName(actor)
  if (!actor) return null

  return (
    <View style={a.gap_xs}>
      <InlineLinkText
        testID={testID}
        emoji
        to={makeProfileLink(actor)}
        label={l`View ${name}’s profile`}
        style={[a.self_start, a.text_sm, t.atoms.text]}>
        {l`by ${forceLTR(name)}`}
      </InlineLinkText>
      <ActivityHandle actor={actor} />
    </View>
  )
}
