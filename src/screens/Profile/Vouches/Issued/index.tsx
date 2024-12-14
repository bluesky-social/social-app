import React from 'react'
import {View} from 'react-native'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ZodError} from 'zod'

import * as Layout from '#/components/Layout'
import {atoms as a, useGutters} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {useCreateVouch} from '#/state/queries/vouches/useCreateVouch'
import {Loader} from '#/components/Loader'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Admonition} from '#/components/Admonition'
import {useVouchesIssued} from '#/state/queries/vouches/useVouchesIssued'
import {Text} from '#/components/Typography'

export function Screen() {
  const baseGutters = useGutters(['base'])
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Issued Vouches</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[baseGutters]}>
          <Inner />
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

export function Inner() {
  const {data: vouches, isLoading, error} = useVouchesIssued()

  return (
    <View style={[]}>
      <View style={[a.gap_sm]}>
        {isLoading ? (
          <Loader />
        ) : error || !vouches ? (
          <></>
        ) : vouches.length ? (
          <>
            {vouches.map(v => (
              <View>
                <Text>{v.record.subject}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text>No vouches</Text>
          </>
        )}
      </View>
    </View>
  )
}
