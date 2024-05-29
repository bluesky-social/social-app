import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView, ScrollView} from 'view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Text} from '#/components/Typography'

export function WizardStepOne() {
  const {_} = useLingui()
  const t = useTheme()
  const bottomOffset = useBottomBarOffset()

  return (
    <CenteredView style={[a.flex_1, {marginBottom: bottomOffset + 20}]}>
      <ViewHeader title="Create a starter pack" />
      <ScrollView style={[a.flex_1]} contentContainerStyle={[a.flex_1]}>
        <View style={[a.flex_1, a.justify_center, {marginTop: -100}]}>
          <View style={[{height: 150, marginBottom: 50}]}>
            <StarterPackIcon />
          </View>
          <View style={[a.gap_lg, a.align_center, a.px_md]}>
            <Text
              style={[a.font_bold, a.text_lg, t.atoms.text_contrast_medium]}>
              <Trans>Starter packs</Trans>
            </Text>
            <Text style={[a.font_bold, a.text_4xl]}>
              <Trans>Invites, but personal</Trans>
            </Text>
            <Text style={[a.text_center, a.text_md, a.px_md]}>
              <Trans>
                Create your own Bluesky starter packs and invite people directly
                to your favorite feeds, profiles, and more.
              </Trans>
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={a.px_md}>
        <Button
          label={_(msg`Create`)}
          variant="solid"
          color="primary"
          size="large">
          <ButtonText>
            <Trans>Create</Trans>
          </ButtonText>
        </Button>
      </View>
    </CenteredView>
  )
}
