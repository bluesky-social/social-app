import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyModerationDefs} from '@atproto/api'

import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useModServiceInfoQuery} from '#/state/queries/modservice'

export * as Card from '#/components/ModerationServiceCard/Card'

type ModerationServiceProps = {
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
}

export function Link({
  children,
  modservice,
}: ModerationServiceProps & Pick<LinkProps, 'children'>) {
  const {_} = useLingui()

  return (
    <InternalLink
      to={{
        screen: 'ProfileModservice',
        params: {
          name: modservice.creator.handle,
        },
      }}
      label={_(
        msg`View the moderation service provided by @${modservice.creator.handle}`,
      )}>
      {children}
    </InternalLink>
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
