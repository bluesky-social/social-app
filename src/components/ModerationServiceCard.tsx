import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import LinearGradient from 'react-native-linear-gradient'
import {AppBskyModerationDefs} from '@atproto/api'

import {atoms as a, useTheme, tokens, web} from '#/alf'
import {Link, useLinkContext} from '#/components/Link'
import {Text} from '#/components/Typography'
import {RichText} from '#/components/RichText'
import {RaisingHande4Finger_Stroke2_Corner0_Rounded as RaisingHand} from '#/components/icons/RaisingHand'
import {useModServiceInfoQuery} from '#/state/queries/modservice'

type ModerationServiceCardProps = {
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
}

export function ModerationServiceCard({
  modservice,
}: ModerationServiceCardProps) {
  const {_} = useLingui()

  return (
    <Link
      to={{
        screen: 'ProfileModservice',
        params: {
          name: modservice.creator.handle,
        },
      }}
      label={_(
        msg`View the moderation service provided by @${modservice.creator.handle}`,
      )}>
      <Inner modservice={modservice} />
    </Link>
  )
}

function Inner({modservice}: ModerationServiceCardProps) {
  const t = useTheme()
  const {hovered, pressed, focused} = useLinkContext()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_sm,
        a.w_full,
        a.rounded_sm,
        a.pt_md,
        a.pb_sm,
        a.pl_lg,
        a.pr_sm,
        a.overflow_hidden,
        web({
          transition: 'transform 0.2s cubic-bezier(.02,.73,.27,.99)',
        }),
        {
          transform: [{scale: pressed || hovered || focused ? 0.992 : 1}],
        },
      ]}>
      <LinearGradient
        colors={tokens.gradients.midnight.values.map(c => c[1])}
        locations={tokens.gradients.midnight.values.map(c => c[0])}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[a.absolute, a.inset_0]}
      />

      <View style={[a.z_10]}>
        <Text
          style={[a.text_md, a.font_bold, a.pb_2xs, {color: t.palette.white}]}>
          {/* TODO */}
          {modservice.displayName || 'Mod service'}
        </Text>

        {modservice.description ? (
          <RichText
            value={modservice.description}
            style={[{color: t.palette.white}]}
          />
        ) : (
          <Text>
            <Trans>
              Moderation service managed by @{modservice.creator.handle}
            </Trans>
          </Text>
        )}
      </View>

      <RaisingHand size="xl" style={[a.z_10]} fill={t.palette.white} />
    </View>
  )
}

export function ModerationServiceCardSkeleton() {
  return (
    <View>
      <Text>Loading</Text>
    </View>
  )
}

export function Loader({
  did,
  loading: LoadingComponent = ModerationServiceCardSkeleton,
  error: ErrorComponent,
  component: Component,
}: {
  did: string
  loading?: React.ComponentType<{}>
  error?: React.ComponentType<{error: string}>
  component: React.ComponentType<{
    modservice: AppBskyModerationDefs.ModServiceViewDetailed
  }>
}) {
  const {isLoading, data, error} = useModServiceInfoQuery({did})

  return isLoading ? (
    LoadingComponent ? (
      <LoadingComponent />
    ) : null
  ) : error || !data ? (
    ErrorComponent ? (
      <ErrorComponent error={error?.message || 'Unknown error'} />
    ) : null
  ) : (
    <Component modservice={data} />
  )
}
