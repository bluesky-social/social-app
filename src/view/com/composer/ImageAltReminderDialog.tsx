import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

import {atoms as a, useBreakpoints} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text, P} from '#/components/Typography'
import {Button} from '#/components/Button'

export const ImageAltReminderDialog = React.memo(
  function ImageAltReminderDialog({
    control,
    onContinue,
  }: {
    control: Dialog.DialogOuterProps['control']
    onContinue: () => void
  }) {
    const {_} = useLingui()
    const {gtMobile} = useBreakpoints()

    return (
      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          accessibilityDescribedBy="dialog-description-1 dialog-description-2"
          accessibilityLabelledBy="dialog-title">
          <View style={[a.relative, a.gap_md, a.w_full]}>
            <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
              <Trans>Don't forget to make your image accessible</Trans>
            </Text>

            <P nativeID="dialog-description-1" style={[a.text_sm]}>
              <Trans>
                Alt text describes images for blind and low-vision users, and
                helps give context to everyone. Good alt text are concise yet
                detailed, with text in the image being written out or
                summarized.
              </Trans>
            </P>

            <P nativeID="dialog-description-2" style={[a.text_sm]}>
              <Trans>
                You can turn this reminder off in Accessibility settings.
              </Trans>
            </P>

            <View
              style={[gtMobile && {flexDirection: 'row-reverse'}, a.gap_md]}>
              <Button
                variant="solid"
                color="primary"
                size={gtMobile ? 'small' : 'large'}
                onPress={() => control.close()}
                label={_(msg`Add description`)}>
                {_(msg`Add description`)}
              </Button>
              <Button
                variant="outline"
                color="primary"
                size={gtMobile ? 'small' : 'large'}
                onPress={() => {
                  control.close()
                  onContinue()
                }}
                label={_(msg`Not this time`)}>
                {_(msg`Not this time`)}
              </Button>
            </View>

            {!gtMobile && <View style={{height: 40}} />}
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    )
  },
)
