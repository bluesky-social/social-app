import {useMemo} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, select, useTheme} from '#/alf'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button} from '#/components/Button'
import {ShieldCheck_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {logger} from '#/ageAssurance'

export function useInternalState() {
  const aa = useAgeAssurance()
  const {nux} = useNux(Nux.AgeAssuranceDismissibleFeedBanner)
  const {mutate: save, variables} = useSaveNux()
  const hidden = !!variables

  const visible = useMemo(() => {
    if (aa.state.access === aa.Access.Full) return false
    if (aa.state.lastInitiatedAt) return false
    if (aa.state.error === 'config') return false
    if (hidden) return false
    if (nux && nux.completed) return false
    return true
  }, [aa, hidden, nux])

  const close = () => {
    save({
      id: Nux.AgeAssuranceDismissibleFeedBanner,
      completed: true,
      data: undefined,
    })
  }

  return {visible, close}
}

export function AgeAssuranceDismissibleFeedBanner() {
  const t = useTheme()
  const {_} = useLingui()
  const {visible, close} = useInternalState()
  const copy = useAgeAssuranceCopy()

  if (!visible) return null

  return (
    <View
      style={[
        a.px_lg,
        {
          paddingVertical: 10,
          backgroundColor: select(t.name, {
            light: t.palette.primary_25,
            dark: t.palette.primary_25,
            dim: t.palette.primary_25,
          }),
        },
      ]}>
      <Link
        label={_(msg`Learn more about age assurance`)}
        to="/settings/account"
        onPress={() => {
          close()
          logger.metric('ageAssurance:navigateToSettings', {})
        }}
        style={[a.w_full, a.justify_between, a.align_center, a.gap_md]}>
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_full,
            {
              width: 42,
              height: 42,
              backgroundColor: select(t.name, {
                light: t.palette.primary_100,
                dark: t.palette.primary_100,
                dim: t.palette.primary_100,
              }),
            },
          ]}>
          <Shield size="lg" />
        </View>

        <View
          style={[
            a.flex_1,
            {
              paddingRight: 40,
            },
          ]}>
          <View style={{maxWidth: 400}}>
            <Text style={[a.leading_snug]}>{copy.banner}</Text>
          </View>
        </View>
      </Link>

      <Button
        label={_(msg`Don't show again`)}
        size="small"
        onPress={() => {
          close()
          logger.metric('ageAssurance:dismissFeedBanner', {})
        }}
        style={[
          a.absolute,
          a.justify_center,
          a.align_center,
          {
            top: 0,
            bottom: 0,
            right: 0,
            paddingRight: a.px_md.paddingLeft,
          },
        ]}>
        <X
          width={20}
          fill={select(t.name, {
            light: t.palette.primary_600,
            dark: t.palette.primary_600,
            dim: t.palette.primary_600,
          })}
        />
      </Button>
    </View>
  )
}
