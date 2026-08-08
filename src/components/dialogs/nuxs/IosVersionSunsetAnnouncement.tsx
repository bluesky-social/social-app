import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Prompt from '#/components/Prompt'
import {IOS_MAJOR_VERSION, IS_E2E, IS_UNSUPPORTED_IOS} from '#/env'
import {createIsEnabledCheck} from './utils'

export const enabled = createIsEnabledCheck(() => {
  return !IS_E2E && IS_UNSUPPORTED_IOS
})

/**
 * Warns users below the upcoming iOS 16.4 deployment target that they are about
 * to stop receiving app updates.
 *
 * Users on iOS 16.0-16.3 can always reach 16.4, so they get an actionable "go
 * update" message. Users on iOS 15 may be on hardware that cannot go any
 * further, so their copy leads with the end of updates and mentions updating
 * only as a possibility.
 */
export function IosVersionSunsetAnnouncement() {
  const t = useTheme()
  const {t: l} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  /*
   * Gated to below 16.4, so being on iOS 16 at all means the device is one
   * minor update away from staying supported.
   */
  const isOnIos16 = IOS_MAJOR_VERSION >= 16

  return (
    <Prompt.Outer
      control={control}
      onClose={() => {
        nuxDialogs.dismissActiveNux()
      }}>
      <View style={[a.pb_sm]}>
        <WarningIcon size="lg" fill={t.palette.negative_400} />
      </View>

      <Prompt.Content>
        <Prompt.TitleText>
          {isOnIos16 ? (
            <Trans comment="Shown to users on iOS 16.0-16.3, who can update to a supported version.">
              iOS update needed to keep receiving app updates
            </Trans>
          ) : (
            <Trans comment="Shown to users on iOS 15, whose device may not be able to update any further.">
              Bluesky is ending support for iOS 15
            </Trans>
          )}
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          {isOnIos16 ? (
            <Trans comment="Shown to users on iOS 16.0-16.3, who can update to a supported version.">
              Our next app update will require iOS 16.4 or later. Your device
              supports it, so please open iOS Settings and update iOS to keep
              receiving new features and fixes.
            </Trans>
          ) : (
            <Trans comment="Shown to users on iOS 15, whose device may not be able to update any further.">
              Our next app update will require iOS 16.4 or later. You can keep
              using the Bluesky iOS app, but this will be the last version your
              device receives on iOS 15. If your device can update to a newer
              version of iOS, updating will keep new features and fixes coming.
            </Trans>
          )}
        </Prompt.DescriptionText>
      </Prompt.Content>

      <Prompt.Actions>
        <Prompt.Action cta={l`Got it`} onPress={() => {}} />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
