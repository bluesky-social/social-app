import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useUpdateModerationInboxSeenMutation} from '#/state/queries/moderation-inbox'
import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/Circle'
import {ExclamationCircle_Stroke2_Corner0_Rounded as ExclamationCircleIcon} from '#/components/icons/ExclamationCircle'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type AccountEnforcement} from './util/accountData'

export function AccountStatus({
  status,
  enforcement,
  hasActiveStrikes,
}: {
  status: 'good' | 'warning' | 'atRisk'
  enforcement?: AccountEnforcement
  hasActiveStrikes?: boolean
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const ax = useAnalytics()
  const markSeen = useUpdateModerationInboxSeenMutation({silent: true})

  const control = Prompt.usePromptControl()

  const isTakenDown = enforcement?.state === 'takendown'
  const isSuspended = enforcement?.state === 'suspended'
  if (status === 'good') return null

  const isSerious = status === 'atRisk' || isTakenDown || isSuspended
  const Icon = isSerious ? ExclamationCircleIcon : CircleInfoIcon
  const iconColor = isSerious ? t.palette.negative_500 : t.palette.yellow

  const title = isTakenDown
    ? l`Your account has been suspended`
    : isSuspended
      ? l`Your account is temporarily suspended`
      : status === 'atRisk' && enforcement
        ? l`Your account is at risk of permanent suspension`
        : status === 'atRisk'
          ? l`Your account may be suspended or at risk of suspension`
          : hasActiveStrikes
            ? l`Your account has strikes against it`
            : l`Your account has moderation actions`
  const description = isTakenDown ? (
    <Trans>
      Your account is suspended on Bluesky. See your notices for details and
      available appeal options.
    </Trans>
  ) : isSuspended ? (
    <Trans>
      Your account is temporarily suspended on Bluesky. See your notices for
      details and available appeal options.
    </Trans>
  ) : status === 'atRisk' && enforcement && hasActiveStrikes ? (
    <Trans>
      We’ve taken action on your account for violating our Community Guidelines.
      Your record now carries enough strikes that another violation could lead
      to permanent suspension.
    </Trans>
  ) : status === 'atRisk' && enforcement ? (
    <Trans>
      Further violations of our Community Guidelines could lead to permanent
      suspension.
    </Trans>
  ) : status === 'atRisk' ? (
    <Trans>
      Your account may already be suspended or at risk of suspension. See your
      notices for details.
    </Trans>
  ) : hasActiveStrikes ? (
    <Trans>
      We’ve taken action on your account for violating our Community Guidelines,
      and strikes have been added to your record. More violations will lead to
      stronger enforcement, including suspension.
    </Trans>
  ) : (
    <Trans>
      We’ve taken action on your account. See your notices for details.
    </Trans>
  )
  const scheduledEnd =
    isSuspended && enforcement?.expiresAt ? (
      <Trans>
        Scheduled end:{' '}
        {i18n.date(new Date(enforcement.expiresAt), {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </Trans>
    ) : null
  const disclaimer = hasActiveStrikes ? (
    isTakenDown || isSuspended ? (
      <Trans>
        Your account has strikes against it. Strikes come off your record over
        time.
      </Trans>
    ) : (
      <Trans>
        Some account features may be restricted. Strikes come off your record
        over time.
      </Trans>
    )
  ) : !isTakenDown && !isSuspended ? (
    <Trans>Some account features may be restricted.</Trans>
  ) : null

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={l`Show account status`}
        accessibilityHint=""
        onPress={() => {
          ax.metric('moderation:inbox:viewAccountStatus', {status})
          control.open()
          markSeen.mutate({sections: ['accountStatus']})
        }}
        style={[
          a.p_lg,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_sm,
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <Icon size="md" style={{color: iconColor}} />
        <Text style={[a.flex_1, a.text_sm, a.font_semi_bold]}>{title}</Text>
        <ChevronRightIcon size="md" style={[t.atoms.text_contrast_medium]} />
      </Pressable>

      <Prompt.Outer control={control}>
        <Prompt.Content>
          <View style={[a.py_lg, a.align_center, a.justify_center]}>
            <Icon size="4xl" style={{color: iconColor}} />
          </View>
          <Prompt.TitleText>{title}</Prompt.TitleText>
          <Prompt.DescriptionText>{description}</Prompt.DescriptionText>
          {scheduledEnd ? (
            <Prompt.DescriptionText>{scheduledEnd}</Prompt.DescriptionText>
          ) : null}
          {disclaimer ? (
            <Prompt.DescriptionText>{disclaimer}</Prompt.DescriptionText>
          ) : null}
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action cta={l`Done`} onPress={() => control.close()} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
