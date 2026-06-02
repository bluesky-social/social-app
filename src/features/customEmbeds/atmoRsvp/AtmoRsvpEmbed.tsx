import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useRequireAuth} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarIcon} from '#/components/icons/CalendarDays'
import {CircleCheck_Stroke2_Corner0_Rounded as GoingIcon} from '#/components/icons/CircleCheck'
import {Earth_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {PinLocation_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/PinLocation'
import {Star_Stroke2_Corner0_Rounded as InterestedIcon} from '#/components/icons/Star'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {type CustomEmbedComponentProps} from '#/features/customEmbeds/types'
import {type AtmoEventValue, getGoingAttendees} from './api'
import {parseAtmoRsvpEvent} from './detect'
import {EVENT_MODE, EVENT_STATUS_CANCELLED, type RsvpStatus} from './lexicon'
import {useAtmoEventQuery, useRsvpMutation, useViewerRsvpQuery} from './queries'

// Max avatars shown when everyone fits. If there are more, we show one fewer
// face and use the last slot for a "+Y" bubble (so we never render a "+1",
// which would take the same space as just showing that face).
const MAX_FACES = 5

export function AtmoRsvpEmbed({
  view,
  onOpen,
  style,
}: CustomEmbedComponentProps) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const playHaptic = useHaptics()
  const requireAuth = useRequireAuth()

  const ref = parseAtmoRsvpEvent(view.uri)
  const eventQuery = useAtmoEventQuery({
    actor: ref?.actor ?? '',
    rkey: ref?.rkey ?? '',
    enabled: !!ref,
  })
  const event = eventQuery.data
  const eventUri = event?.uri
  const viewerQuery = useViewerRsvpQuery({eventUri})
  const rsvp = useRsvpMutation({
    actor: ref?.actor ?? '',
    rkey: ref?.rkey ?? '',
    eventUri: eventUri ?? '',
    eventCid: event?.cid ?? '',
  })

  const value = event?.value
  const isCancelled = value?.status === EVENT_STATUS_CANCELLED
  const whenText = formatWhen(i18n, value)
  const where = getLocationInfo(value)
  const goingCount = event?.rsvpsGoingCount ?? 0
  const allGoing = event ? getGoingAttendees(event) : []
  const showBubble = goingCount > MAX_FACES
  const faces = allGoing.slice(0, showBubble ? MAX_FACES - 1 : MAX_FACES)
  const overflow = showBubble ? goingCount - faces.length : 0
  const currentStatus = viewerQuery.data?.status ?? null
  const canRsvp = !!eventUri && !!event?.cid

  const onPressCard = () => {
    playHaptic('Light')
    onOpen?.()
  }

  const onPressStatus = (target: RsvpStatus) => {
    requireAuth(() => {
      playHaptic('Light')
      rsvp.mutate(currentStatus === target ? null : target)
    })
  }

  return (
    <View
      style={[
        a.flex_col,
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
        style,
      ]}>
      <Link
        label={view.title || l`Open event on ${toNiceDomain(view.uri)}`}
        to={view.uri}
        shouldProxy
        onPress={onPressCard}>
        <View style={[a.w_full]}>
          {view.thumb ? (
            <Image
              style={[a.aspect_card]}
              source={{uri: view.thumb}}
              accessibilityIgnoresInvertColors
              loading="lazy"
            />
          ) : undefined}

          <View style={[a.px_md, a.pt_sm, a.pb_xs, a.gap_xs]}>
            {isCancelled && (
              <Text
                style={[
                  a.text_xs,
                  a.font_bold,
                  {color: t.palette.negative_500},
                ]}>
                <Trans>Cancelled</Trans>
              </Text>
            )}
            <Text
              emoji
              numberOfLines={2}
              style={[a.text_md, a.font_bold, a.leading_snug]}>
              {view.title || view.uri}
            </Text>

            <View style={[a.gap_2xs, a.pt_2xs]}>
              {whenText && (
                <MetaRow
                  icon={CalendarIcon}
                  text={l`${whenText} · your time`}
                />
              )}
              {where && (
                <MetaRow
                  icon={where.virtual ? GlobeIcon : PinIcon}
                  text={where.text || l`Online`}
                />
              )}
            </View>

            {view.description ? (
              <Text
                emoji
                numberOfLines={2}
                style={[
                  a.text_sm,
                  a.leading_snug,
                  a.pt_2xs,
                  t.atoms.text_contrast_medium,
                ]}>
                {view.description}
              </Text>
            ) : undefined}
          </View>
        </View>
      </Link>

      <Divider />

      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.flex_wrap,
          a.gap_sm,
          a.px_md,
          a.py_sm,
        ]}>
        <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_1]}>
          {eventQuery.isLoading ? (
            <Loader size="sm" />
          ) : faces.length > 0 || overflow > 0 ? (
            <View
              style={[a.flex_row, a.align_center]}
              accessible
              accessibilityLabel={plural(goingCount, {
                one: '# going',
                other: '# going',
              })}
              accessibilityHint={l`People going to this event`}>
              {faces.map((person, i) => (
                <View
                  key={person.did}
                  style={[
                    i > 0 && {marginLeft: -8},
                    a.rounded_full,
                    {borderWidth: 2, borderColor: t.atoms.bg.backgroundColor},
                  ]}>
                  <UserAvatar type="user" size={24} avatar={person.avatar} />
                </View>
              ))}
              {overflow > 0 && (
                <View
                  style={[
                    faces.length > 0 && {marginLeft: -8},
                    a.rounded_full,
                    {borderWidth: 2, borderColor: t.atoms.bg.backgroundColor},
                  ]}>
                  <View
                    style={[
                      a.rounded_full,
                      a.align_center,
                      a.justify_center,
                      {width: 24, height: 24},
                      t.atoms.bg_contrast_50,
                    ]}>
                    <Text
                      style={[
                        a.text_xs,
                        a.font_bold,
                        t.atoms.text_contrast_medium,
                      ]}>
                      +{overflow}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {canRsvp && (
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <Button
              label={l`Going`}
              size="small"
              color={currentStatus === 'going' ? 'primary' : 'secondary'}
              onPress={() => onPressStatus('going')}
              disabled={rsvp.isPending}>
              <ButtonIcon icon={GoingIcon} />
              <ButtonText>
                <Trans>Going</Trans>
              </ButtonText>
            </Button>
            <Button
              label={l`Interested`}
              size="small"
              color={currentStatus === 'interested' ? 'primary' : 'secondary'}
              onPress={() => onPressStatus('interested')}
              disabled={rsvp.isPending}>
              <ButtonIcon icon={InterestedIcon} />
              <ButtonText>
                <Trans>Interested</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

function MetaRow({
  icon: Icon,
  text,
}: {
  icon: typeof CalendarIcon
  text: string
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <Icon size="xs" style={t.atoms.text_contrast_medium} />
      <Text
        numberOfLines={1}
        style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
        {text}
      </Text>
    </View>
  )
}

function formatWhen(
  i18n: ReturnType<typeof useLingui>['i18n'],
  value?: AtmoEventValue,
): string | null {
  if (!value?.startsAt) return null
  try {
    // Render in the viewer's local timezone (no `timeZone` option). The label
    // appended in the component clarifies this is "your time".
    return i18n.date(new Date(value.startsAt), {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return null
  }
}

type LocationInfo = {virtual: boolean; text?: string}

function getLocationInfo(value?: AtmoEventValue): LocationInfo | null {
  if (!value) return null
  if (value.mode === EVENT_MODE.virtual) return {virtual: true}

  const location = value.locations?.[0]
  if (location) {
    if (location.$type?.endsWith('location.address')) {
      const text = [
        location.name,
        location.street,
        location.locality,
        location.region,
        location.country,
      ]
        .filter(Boolean)
        .join(', ')
      if (text) return {virtual: false, text}
    }
    if (location.uri) {
      return {virtual: true, text: location.name}
    }
  }
  return null
}
