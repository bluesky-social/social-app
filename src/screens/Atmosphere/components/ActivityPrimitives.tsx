import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {type ActivityActor} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {type Props as IconProps} from '#/components/icons/common'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function ActivityCard({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13},
      ]}>
      {children}
    </View>
  )
}

export function ActivityTimestamp({timestamp}: {timestamp: string}) {
  const t = useTheme()
  return (
    <TimeElapsed timestamp={timestamp}>
      {({timeElapsed}) => (
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {timeElapsed}
        </Text>
      )}
    </TimeElapsed>
  )
}

/** Actors must already be usable, deduplicated, and in API order. */
export function ActivityActorLine({
  actors,
  action,
  timestamp,
  showAvatars = true,
  testID,
}: {
  testID?: string
  actors: ActivityActor[]
  action: string
  timestamp?: string
  showAvatars?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const primary = actors[0]
  if (!primary) return null
  const handle = sanitizeHandle(primary.handle, '@')
  const count = actors.length - 1
  const others =
    count > 0
      ? l`and ${plural(count, {one: '# other', other: '# others'})}`
      : ''
  const content = (elapsed?: string) => (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      {showAvatars ? (
        <AvatarStack
          profiles={actors.slice(0, 5) as bsky.profile.AnyProfileView[]}
          size={16}
        />
      ) : null}
      <Text
        testID={testID}
        emoji
        accessibilityHint=""
        accessibilityLabel={`${[handle, others, action].filter(Boolean).join(' ')}${elapsed ? ` · ${elapsed}` : ''}`}
        style={[
          a.flex_1,
          a.text_xs,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        <InlineLinkText
          emoji
          to={makeProfileLink(primary)}
          label={l`View ${handle}’s profile`}
          style={[a.text_xs, a.font_semi_bold, t.atoms.text_contrast_medium]}>
          {handle}
        </InlineLinkText>
        {others ? ` ${others}` : ''} {action}
        {elapsed ? ` · ${elapsed}` : ''}
      </Text>
    </View>
  )
  return timestamp ? (
    <TimeElapsed timestamp={timestamp}>
      {({timeElapsed}) => content(timeElapsed)}
    </TimeElapsed>
  ) : (
    content()
  )
}

export function ActivityFootnote({
  title,
  to,
  icon: Icon,
  suffix,
  thumb,
  menu,
  children,
}: {
  title: string
  to?: string
  icon: React.ComponentType<IconProps>
  suffix?: string
  thumb?: string
  menu?: React.ReactNode
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View testID="atmosphereFootnote" style={[a.flex_row, a.gap_md]}>
      <View style={{paddingTop: 2}}>
        <Icon size="sm" style={t.atoms.text_contrast_medium} />
      </View>
      <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
        <Text emoji numberOfLines={3} style={[a.text_sm, a.leading_snug]}>
          {to ? (
            <InlineLinkText
              emoji
              disableMismatchWarning
              to={to}
              label={title}
              style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
              {title}
            </InlineLinkText>
          ) : (
            title
          )}
          {suffix ? (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {` ${suffix}`}
            </Text>
          ) : null}
        </Text>
        {children}
      </View>
      {thumb && to ? (
        <Link to={to} label={title}>
          <Image
            testID="atmosphereFootnoteThumbnail"
            source={{uri: thumb}}
            style={[a.rounded_sm, {width: 44, height: 44}]}
            contentFit="cover"
            accessible={false}
            accessibilityIgnoresInvertColors
            loading="lazy"
            useAppleWebpCodec
          />
        </Link>
      ) : null}
      {menu}
    </View>
  )
}
