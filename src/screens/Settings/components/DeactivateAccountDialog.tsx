import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {DialogOuterProps} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

export function DeactivateAccountDialog({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Prompt.Outer control={control} testID="confirmModal">
      <Prompt.TitleText>{_(msg`Deactivate account`)}</Prompt.TitleText>
      <Prompt.DescriptionText>
        <Trans>
          Your profile, posts, feeds, and lists will no longer be visible to
          other Bluesky users. You can reactivate your account at any time by
          logging in.
        </Trans>
      </Prompt.DescriptionText>

      <View style={[a.pb_xl]}>
        <Divider />
        <View style={[a.gap_sm, a.pt_lg, a.pb_xl]}>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              There is no time limit for account deactivation, come back any
              time.
            </Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              If you're trying to change your handle or email, do so before you
              deactivate.
            </Trans>
          </Text>
        </View>

        <Divider />
      </View>
      <Prompt.Actions>
        <Prompt.Action
          cta={_(msg`Yes, deactivate`)}
          onPress={() => {}}
          color="negative"
        />
        <Prompt.Cancel />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
