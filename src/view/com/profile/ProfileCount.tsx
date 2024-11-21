import React from 'react'
import {useLingui} from '@lingui/react'

import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useProfileQuery} from '../../../state/queries/profile'
import {formatCount} from '../util/numeric/format'

export function ProfileCount({
  name,
  metric,
}: {
  name: string
  metric: 'followersCount' | 'followsCount'
}) {
  const t = useTheme()
  const {
    data: resolvedDid,
    isLoading: isDidLoading,
    error: resolveError,
  } = useResolveDidQuery(name)
  const {
    data: profile,
    error: profileError,
    isLoading: isLoadingProfile,
  } = useProfileQuery({
    did: resolvedDid,
  })

  const {i18n} = useLingui()

  if (
    isDidLoading ||
    isLoadingProfile ||
    profileError ||
    resolveError ||
    !profile
  ) {
    return null
  }

  return (
    <Text
      style={[
        a.text_sm,
        a.font_bold,
        a.rounded_md,
        t.atoms.bg_contrast_100,
        a.px_sm,
        a.py_xs,
      ]}>
      {formatCount(i18n, profile[metric] || 0, 'standard')}
    </Text>
  )
}
