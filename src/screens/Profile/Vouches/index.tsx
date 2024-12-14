import {View, ScrollView} from 'react-native'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Loader} from '#/components/Loader'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {atoms as a, useTheme, useGutters} from '#/alf'
import {Link} from '#/components/Link'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {useSession} from '#/state/session'
import {useVouchesIssued} from '#/state/queries/vouches/useVouchesIssued'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Divider} from '#/components/Divider'

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
      <View style={[a.flex_row, a.align_center, a.justify_between, baseGutters]}>
        <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
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
          shape="round"
          style={[a.flex_row, a.align_center, a.justify_center]}>
          <ButtonIcon icon={ChevronRight} />
        </Link>
      </View>

      <View style={[a.gap_sm]}>
        {isLoading ? (
          <Loader />
        ) : error || !vouches ? (
          <>
            {error ? (
              <Text>{error.toString()}</Text>
            ) : (
              <Text>
                <Trans>Somthing went wrong</Trans>
              </Text>
            )}
          </>
        ) : vouches.length ? (
          <ScrollView horizontal style={[baseGutters]}>
            {vouches.map(v => (
              <View style={[a.p_sm, a.rounded_md, a.flex_1, a.gap_sm, t.atoms.bg_contrast_25, {
                maxWidth: 300,
              }]}>
                <View style={[a.flex_row, a.align_start, a.gap_sm]}>
                  <UserAvatar size={32} avatar={v.subject?.avatar} />
                  <View style={[a.gap_2xs]}>
                    <Text style={[a.text_md, a.font_bold, a.leading_tight]}>@{v.subject?.handle}</Text>
                    <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>{v.record.relationship}</Text>
                  </View>
                </View>
                <Divider />
                <View style={[a.flex_row, a.align_start, a.gap_xl]}>
                  <Text style={[a.font_bold, a.leading_tight]}>{v.accept ? 'Accepted' : 'Pending'}</Text>
                  <Text style={[a.leading_tight]}>{v.record.createdAt}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <>
            <Text>No vouches</Text>
          </>
        )}
      </View>
    </View>
  )
}
