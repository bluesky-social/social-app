import {useMemo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssurance} from '#/state/ageAssurance/useAgeAssurance'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, select, useTheme} from '#/alf'
import {ShieldCheck_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function useInternalState() {
  const {isReady, isDeclaredUnderage, isAgeRestricted, lastInitiatedAt} =
    useAgeAssurance()
  const {nux} = useNux(Nux.AgeAssuranceDismissibleHeaderButton)
  const {mutate: save, variables} = useSaveNux()
  const hidden = !!variables

  const visible = useMemo(() => {
    if (!isReady) return false
    if (isDeclaredUnderage) return false
    if (!isAgeRestricted) return false
    if (lastInitiatedAt) return false
    if (hidden) return false
    if (nux && nux.completed) return false
    return true
  }, [
    isReady,
    isDeclaredUnderage,
    isAgeRestricted,
    lastInitiatedAt,
    hidden,
    nux,
  ])

  const close = () => {
    save({
      id: Nux.AgeAssuranceDismissibleHeaderButton,
      completed: true,
      data: undefined,
    })
  }

  return {visible, close}
}

export function AgeAssuranceDismissibleHeaderButton() {
  const t = useTheme()
  const {_} = useLingui()
  const {visible, close} = useInternalState()

  if (!visible) return null

  return (
    <Link
      label={_(msg`Learn more about age assurance`)}
      to="/settings/account"
      onPress={close}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_xs,
          a.px_sm,
          a.pr_sm,
          a.rounded_full,
          {
            paddingVertical: 6,
            backgroundColor: select(t.name, {
              light: t.palette.primary_100,
              dark: t.palette.primary_100,
              dim: t.palette.primary_100,
            }),
          },
        ]}>
        <Shield size="sm" />
        <Text
          style={[
            a.font_bold,
            a.leading_snug,
            {
              color: select(t.name, {
                light: t.palette.primary_800,
                dark: t.palette.primary_800,
                dim: t.palette.primary_800,
              }),
            },
          ]}>
          <Trans>Age Assurance</Trans>
        </Text>
      </View>
    </Link>
  )
}
