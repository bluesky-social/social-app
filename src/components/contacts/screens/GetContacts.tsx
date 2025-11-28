import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, tokens, useGutters} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {type Action, type State} from '../state'

export function GetContacts({
  onCancel,
}: {
  state: Extract<State, {step: '3: get contacts'}>
  dispatch: React.Dispatch<Action>
  onCancel: () => void
}) {
  const {_} = useLingui()
  const insets = useSafeAreaInsets()

  const gutters = useGutters([0, 'wide'])

  const style = [a.text_md, a.leading_snug, a.mt_md]

  return (
    <View style={[a.h_full]}>
      <Layout.Content contentContainerStyle={[gutters, a.flex_1, a.pt_xl]}>
        <Text style={[a.font_bold, a.text_3xl]}>
          <Trans>Share Your Contacts to Find Friends</Trans>
        </Text>
        <Text style={style}>
          <Trans>
            Bluesky helps friends find each other by creating “hashes” of number
            combinations and looking for matching hashes. Hashes are sets of
            numbers and letters that can’t be decoded with a key.
          </Trans>
        </Text>
        <Text style={[style, a.mt_lg]}>
          &bull; <Trans>We only suggest follows if both people consent</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>We never store plain phone numbers</Trans>
        </Text>
        <Text style={style}>
          &bull;{' '}
          <Trans>We save only non-matching hashes for future matching</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>You can always opt out</Trans>
        </Text>
        <Text style={[style, a.mt_lg]}>
          <Trans>
            We apply the highest privacy standards just in case just in case
            your contacts include minors. We never share, or sell your contact
            information.
          </Trans>
        </Text>
      </Layout.Content>
      <View
        style={[
          gutters,
          a.pt_xs,
          {paddingBottom: Math.max(insets.bottom, tokens.space.xl)},
          a.gap_md,
        ]}>
        <Text style={[a.text_sm, a.pb_xs]}>
          <Trans>
            I consent to Bluesky using my contacts for mutual friend discovery
            and to retain hashed data for matching until I opt out.
          </Trans>
        </Text>
        <Button label={_(msg`Find my friends`)} size="large" color="primary">
          <ButtonText>
            <Trans>Find my friends</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`Cancel`)}
          size="large"
          color="secondary"
          onPress={onCancel}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
