import {View} from 'react-native'
import {updateActiveVideoViewAsync} from '@bsky.app/video'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {IPadBetaHero} from '#/components/dialogs/nuxs/IPadBetaHero'
import {createIsEnabledCheck} from '#/components/dialogs/nuxs/utils'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Text} from '#/components/Typography'
import {IS_E2E, IS_IPAD} from '#/env'

/*
 * Only builds that support tablets report `IS_IPAD` (an iPhone-only build
 * running on an iPad reports the phone idiom), and for now those are the dev
 * and TestFlight builds, see `supportsTablet` in app.config.js.
 */
export const enabled = createIsEnabledCheck(() => IS_IPAD && !IS_E2E)

export function IPadBetaAnnouncement() {
  const t = useTheme()
  const {t: l} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        nuxDialogs.dismissActiveNux()
        // The hero took over playback, so hand it back to any feed video
        void updateActiveVideoViewAsync()
      }}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`iPad support is here`}
        contentContainerStyle={[
          {paddingTop: 0, paddingLeft: 0, paddingRight: 0},
        ]}>
        <IPadBetaHero />
        {/* Matches ScrollableInner's bottom padding, so the edges are even */}
        <View style={[a.align_center, a.gap_2xl, a.px_2xl, a.pt_xl]}>
          <View style={[a.align_center, a.gap_sm]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <BeakerIcon fill={t.palette.primary_700} size="sm" />
              <Text style={[a.font_semi_bold, {color: t.palette.primary_700}]}>
                <Trans>Beta Feature</Trans>
              </Text>
            </View>
            <Text
              style={[
                a.leading_tight,
                a.font_bold,
                a.text_center,
                {fontSize: 32, maxWidth: 360},
              ]}>
              <Trans>iPad support is here</Trans>
            </Text>
            <Text
              style={[
                a.text_md,
                a.leading_snug,
                a.text_center,
                {maxWidth: 340},
              ]}>
              <Trans>
                Bluesky now makes full use of your iPad’s screen, in any
                orientation. It’s still in beta, so if something looks off, let
                us know in Settings → Beta features.
              </Trans>
            </Text>
          </View>

          <Button
            label={l`Got it`}
            size="large"
            color="primary"
            onPress={() => control.close()}
            style={[a.w_full]}>
            <ButtonText>
              <Trans>Got it</Trans>
            </ButtonText>
          </Button>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
