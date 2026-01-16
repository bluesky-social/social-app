import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {isFindContactsFeatureEnabled} from '#/components/contacts/country-allowlist'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {
  createIsEnabledCheck,
  isExistingUserAsOf,
} from '#/components/dialogs/nuxs/utils'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'
import {IS_E2E} from '#/env'
import {navigate} from '#/Navigation'

export const enabled = createIsEnabledCheck(props => {
  return (
    !IS_E2E &&
    IS_NATIVE &&
    isExistingUserAsOf(
      '2025-12-16T00:00:00.000Z',
      props.currentProfile.createdAt,
    ) &&
    isFindContactsFeatureEnabled(props.geolocation.countryCode)
  )
})

export function FindContactsAnnouncement() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Introducing finding friends via contacts`)}
        style={[web({maxWidth: 440})]}
        contentContainerStyle={[
          {
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        ]}>
        <View style={[a.align_center, a.pt_3xl]}>
          <LinearGradient
            colors={[t.palette.primary_200, t.atoms.bg.backgroundColor]}
            locations={[0, 1]}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
          <View style={[a.w_full, a.pt_sm, a.px_5xl, a.pb_4xl]}>
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../../../assets/images/find_friends_illustration.webp')}
              style={[a.w_full, {aspectRatio: 1278 / 661}]}
              alt={_(
                msg`An illustration depicting user avatars flowing from a contact book into the Bluesky app`,
              )}
            />
          </View>
        </View>
        <View style={[a.align_center, a.px_xl, a.gap_5xl]}>
          <View style={[a.gap_sm, a.align_center]}>
            <Text
              style={[
                a.text_4xl,
                a.leading_tight,
                a.font_bold,
                a.text_center,
                {
                  fontSize: IS_WEB ? 28 : 32,
                  maxWidth: 300,
                },
              ]}>
              <Trans>Find your friends</Trans>
            </Text>
            <Text
              style={[
                a.text_md,
                t.atoms.text_contrast_medium,
                a.leading_snug,
                a.text_center,
                {maxWidth: 340},
              ]}>
              <Trans>
                Bluesky is more fun with friends! Import your contacts to see
                who’s already here.
              </Trans>
            </Text>
          </View>

          <Button
            label={_(msg`Import Contacts`)}
            size="large"
            color="primary"
            onPress={() => {
              logger.metric('contacts:nux:ctaPressed', {})
              control.close(() => {
                navigate('FindContactsFlow')
              })
            }}
            style={[a.w_full]}>
            <ButtonText>
              <Trans>Import Contacts</Trans>
            </ButtonText>
          </Button>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
