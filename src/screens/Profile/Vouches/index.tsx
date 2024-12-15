import {ScrollView,View} from 'react-native'
import {msg,Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useVouchesIssued} from '#/state/queries/vouches/useVouchesIssued'
import {useSession} from '#/state/session'
import {Vouch} from '#/screens/Profile/Vouches/components/Vouch'
import {atoms as a, useGutters,useTheme} from '#/alf'
import {ButtonIcon,ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function Screen() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const baseGutters = useGutters(['base'])
  const compactGutters = useGutters(['compact'])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Vouches</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.gap_lg]}>
          <View style={[baseGutters, a.gap_lg]}>
            <Link
              label={_(msg`Create a new vouch`)}
              to={{
                screen: 'ProfileVouchesCreate',
                params: {name: currentAccount!.handle},
              }}>
              {({hovered}) => (
                <View
                  style={[
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    a.rounded_md,
                    compactGutters,
                    t.atoms.bg_contrast_25,
                    hovered && [t.atoms.bg_contrast_50],
                  ]}>
                  <View style={[a.flex_1]}>
                    <Text style={[a.text_lg, a.font_heavy]}>Create vouch</Text>
                  </View>

                  <ChevronRight />
                </View>
              )}
            </Link>
          </View>
        </View>

        <VouchesIssued />
      </Layout.Content>
    </Layout.Screen>
  )
}

export function VouchesIssued() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: vouches, isLoading, error} = useVouchesIssued()
  const baseGutters = useGutters([0, 'base'])

  return (
    <View style={[]}>
      <View style={[baseGutters, a.pb_md]}>
        <View style={[a.flex_row, a.align_center, a.justify_between, a.pb_xs]}>
          <Text style={[a.text_lg, a.font_heavy, t.atoms.text_contrast_medium]}>
            <Trans>Vouches Issued</Trans>
          </Text>

          <Link
            label={_(msg`View All`)}
            to={{
              screen: 'ProfileVouchesIssued',
              params: {name: currentAccount!.handle},
            }}
            size="small"
            variant="ghost"
            color="secondary"
            style={[a.flex_row, a.align_center, a.justify_center]}>
            <ButtonText>
              <Trans>See all</Trans>
            </ButtonText>
            <ButtonIcon icon={ChevronRight} position="right" />
          </Link>
        </View>
        <Divider />
      </View>

      {isLoading ? (
        <View style={[baseGutters, a.py_lg]}>
          <Loader />
        </View>
      ) : error || !vouches ? (
        <View style={[baseGutters, a.py_lg]}>
          {error ? (
            <Text>{error.toString()}</Text>
          ) : (
            <Text>
              <Trans>Somthing went wrong</Trans>
            </Text>
          )}
        </View>
      ) : vouches.pages.at(0)?.vouches?.length ? (
        <ScrollView
          horizontal
          style={[baseGutters]}
          contentContainerStyle={[a.gap_md]}>
          {vouches.pages[0].vouches.map(v => (
            <Vouch key={v.cid} vouch={v} subject={v.subject!} />
          ))}
        </ScrollView>
      ) : (
        <View style={[baseGutters, a.py_lg]}>
          <Text>No vouches</Text>
        </View>
      )}
    </View>
  )
}
