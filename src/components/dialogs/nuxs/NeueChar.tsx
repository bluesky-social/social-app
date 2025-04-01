import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Text} from '#/components/Typography'

// midnight PDT on April 1st, 2025
export const EXPIRY = new Date('2025-04-02T07:00:00Z')

export function isEnabled() {
  return new Date() < EXPIRY
}

export function NeueChar() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()
  const {gtMobile} = useBreakpoints()
  const [height, setHeight] = React.useState(0)

  Dialog.useAutoOpen(control, 3e3)

  const onClose = React.useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  return (
    <Dialog.Outer control={control} onClose={onClose}>
      <Dialog.Inner label={_(msg`Special announcement dialog for April Fools`)}>
        <View
          onLayout={e => {
            setHeight(e.nativeEvent.layout.height)
          }}
          style={[
            a.absolute,
            a.inset_0,
            a.overflow_hidden,
            {
              backgroundColor: 'black',
              bottom: 'auto',
              paddingTop: gtMobile ? '42%' : '60%',
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            },
          ]}>
          <Image
            source={require('../../../../assets/misc/neue-char.jpg')}
            style={[
              a.absolute,
              {
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
              },
            ]}
            contentFit="cover"
            alt={_(
              msg`Fake conversation with the Bluesky app. Bluesky says: "i ain't reading all that", then "I'm happy for you though", and finally "or sorry that happened". This is in reference to a popular internet meme.`,
            )}
            accessibilityIgnoresInvertColors={false}
          />
        </View>

        <View
          style={[
            {
              paddingTop: height - a.pt_2xl.paddingTop, // dialog padding
            },
          ]}
        />

        <View
          style={[
            gtMobile ? [a.py_3xl, a.pb_md] : [a.pt_xl, a.pb_sm],
            a.mx_auto,
            {maxWidth: 360},
          ]}>
          <Text
            style={[
              a.text_3xl,
              a.text_center,
              a.font_heavy,
              a.leading_tight,
              a.mx_auto,
              {maxWidth: 330},
            ]}>
            <Trans>New character limit 🎉</Trans>
          </Text>
          <Text style={[a.text_lg, a.text_center, a.pt_md, a.leading_snug]}>
            <Trans>
              We’re listening to your feedback and updating the character count.
              Posts are now limited to 299 characters!
            </Trans>
          </Text>

          <Text
            style={[
              a.text_md,
              a.text_center,
              a.pt_md,
              a.leading_snug,
              a.italic,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>For a limited time — just today ;)</Trans>
          </Text>

          {!gtMobile && (
            <View style={[a.pt_2xl]}>
              <Button
                label={_(msg`Got it!`)}
                onPress={onClose}
                size="large"
                variant="solid"
                color="primary">
                <ButtonText>{_(msg`Got it!`)}</ButtonText>
              </Button>
            </View>
          )}
        </View>

        <Dialog.Close />
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
