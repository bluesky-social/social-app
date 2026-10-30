import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {ACTIVITY_ROW_AVATAR_SIZE} from '#/screens/Atmosphere/constants'
import {type ActivityActor} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {type Props as IconProps} from '#/components/icons/common'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {ActivityHandle, useActivityDisplayName} from './ActivityIdentity'

export function ActivityCard({
  children,
  padded = true,
}: {
  children: React.ReactNode
  padded?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.border,
        a.rounded_md,
        padded && a.p_lg,
        t.atoms.bg,
        t.atoms.border_contrast_low,
      ]}>
      {children}
    </View>
  )
}

/** Keeps the primary avatar and action badge in a fixed feed-sized column. */
export function ActivityRowContent({
  actors,
  icon: Icon,
  iconColor,
  header,
  actions,
  children,
}: {
  actors: ActivityActor[]
  icon?: React.ComponentType<IconProps>
  iconColor?: string
  header: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const primary = actors[0]
  const name = useActivityDisplayName(primary)

  return (
    <View style={[a.flex_row, a.align_start, a.gap_md]}>
      <View
        style={[
          a.flex_shrink_0,
          {width: ACTIVITY_ROW_AVATAR_SIZE, minHeight: Icon ? 48 : 42},
        ]}>
        {primary ? (
          <Link to={makeProfileLink(primary)} label={l`${name}’s avatar`}>
            <AvatarStack
              profiles={[primary]}
              size={ACTIVITY_ROW_AVATAR_SIZE}
              borderWidth={0}
            />
          </Link>
        ) : null}
        {Icon ? (
          <View
            style={[
              a.absolute,
              a.rounded_full,
              a.p_2xs,
              t.atoms.bg,
              {end: -4, top: 24},
            ]}>
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.rounded_full,
                {
                  width: 20,
                  height: 20,
                  backgroundColor: iconColor ?? t.palette.primary_500,
                },
              ]}>
              <Icon size="xs" fill={t.palette.white} />
            </View>
          </View>
        ) : null}
      </View>
      <View style={[a.flex_1, a.gap_md, {minWidth: 0}]}>
        <View style={[a.flex_row, a.align_start, a.gap_sm]}>
          <View style={[a.flex_1, a.gap_md, {minWidth: 0}]}>
            {actors.length > 1 ? (
              <AvatarStack profiles={actors.slice(1, 5)} size={26} />
            ) : null}
            {header}
          </View>
          {actions}
        </View>
        {children}
      </View>
    </View>
  )
}

export function ActivityTimestamp({timestamp}: {timestamp: string}) {
  const t = useTheme()
  return (
    <TimeElapsed timestamp={timestamp}>
      {({timeElapsed}) => (
        <Text style={[a.self_start, a.text_sm, t.atoms.text_contrast_medium]}>
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
  icon: Icon,
  iconColor,
  testID,
}: {
  testID?: string
  actors: ActivityActor[]
  action: string
  timestamp?: string
  showAvatars?: boolean
  icon?: React.ComponentType<IconProps>
  iconColor?: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const primary = actors[0]
  const name = useActivityDisplayName(primary)
  if (!primary) return null
  const count = actors.length - 1
  const others =
    count > 0
      ? l`and ${plural(count, {one: '# other', other: '# others'})}`
      : ''
  const content = (elapsed?: string) => (
    <View style={[a.flex_shrink, a.flex_row, a.align_start, a.gap_sm]}>
      {Icon ? <Icon size="sm" fill={iconColor} /> : null}
      {showAvatars ? (
        <AvatarStack profiles={actors.slice(0, 5)} size={26} />
      ) : null}
      <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
        <Text
          testID={testID}
          emoji
          accessibilityHint=""
          accessibilityLabel={`${[name, others, action].filter(Boolean).join(' ')}${elapsed ? ` · ${elapsed}` : ''}`}
          style={[a.text_md, a.leading_snug, t.atoms.text]}>
          <InlineLinkText
            emoji
            to={makeProfileLink(primary)}
            label={l`View ${name}’s profile`}
            style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
            {forceLTR(name)}
          </InlineLinkText>
          {others ? ` ${others}` : ''} {action}
          {elapsed ? (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {` · ${elapsed}`}
            </Text>
          ) : null}
        </Text>
        <ActivityHandle actor={primary} />
      </View>
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
  iconColor,
  actors = [],
  action,
  timestamp,
  app,
  suffix,
  thumb,
  actions,
  children,
}: {
  title: string
  to?: string
  icon: React.ComponentType<IconProps>
  iconColor?: string
  actors?: ActivityActor[]
  action?: string
  timestamp?: string
  app?: {name: string; to: string}
  suffix?: string
  thumb?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const primary = actors[0]
  const name = useActivityDisplayName(primary)
  const count = actors.length - 1
  const others =
    count > 0
      ? l`and ${plural(count, {one: '# other', other: '# others'})}`
      : undefined
  const content = (
    <Text
      testID="atmosphereFootnoteText"
      emoji
      numberOfLines={3}
      style={[a.text_md, a.leading_snug, t.atoms.text]}>
      {primary ? (
        <>
          <InlineLinkText
            testID="atmosphereFootnoteActor"
            emoji
            to={makeProfileLink(primary)}
            label={l`View ${name}’s profile`}
            style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
            {forceLTR(name)}
          </InlineLinkText>
          {others ? ` ${others}` : ''}
          {action ? ` ${action} ` : ' '}
        </>
      ) : null}
      {to ? (
        <InlineLinkText
          testID="atmosphereFootnoteTitle"
          emoji
          disableMismatchWarning
          to={to}
          label={title}
          style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
          {title}
        </InlineLinkText>
      ) : (
        <Text emoji style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
          {title}
        </Text>
      )}
      {suffix ? ` ${suffix}` : ''}
      {app ? (
        <>
          {` ${l`via`} `}
          <InlineLinkText
            testID="atmosphereFootnoteApp"
            to={app.to}
            label={l`Visit ${app.name}`}
            style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
            {app.name}
          </InlineLinkText>
        </>
      ) : null}
    </Text>
  )

  return (
    <ActivityRowContent
      actors={actors}
      icon={Icon}
      iconColor={iconColor}
      actions={actions}
      header={
        <View
          testID="atmosphereFootnote"
          style={[a.flex_row, a.align_start, a.gap_sm]}>
          <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
            {content}
            <ActivityHandle actor={primary} />
            {children}
            {timestamp ? <ActivityTimestamp timestamp={timestamp} /> : null}
          </View>
          {thumb && to ? (
            <Link to={to} label={title} style={a.flex_shrink_0}>
              <Image
                testID="atmosphereFootnoteThumbnail"
                source={{uri: thumb}}
                style={[a.rounded_sm, {width: 60, height: 60}]}
                contentFit="cover"
                accessible={false}
                accessibilityIgnoresInvertColors
                loading="lazy"
                useAppleWebpCodec
              />
            </Link>
          ) : null}
        </View>
      }
    />
  )
}
