import React from 'react'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {View} from 'react-native'
import ViewShot from 'react-native-view-shot'

import {atoms as a, useBreakpoints, tokens} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {GradientFill} from '#/components/GradientFill'
import {Button, ButtonText} from '#/components/Button'
import {useComposerControls} from 'state/shell'

import {useContext} from '#/components/dialogs/nudges'

export function TenMillion() {
  const {_} = useLingui()
  const {controls} = useContext()
  const {gtMobile} = useBreakpoints()
  const {openComposer} = useComposerControls()

  const imageRef = React.useRef<ViewShot>(null)

  const share = () => {
    if (imageRef.current && imageRef.current.capture) {
      imageRef.current.capture().then(uri => {
        controls.tenMillion.close(() => {
          setTimeout(() => {
            openComposer({
              text: '10 milly, babyyy',
              imageUris: [
                {
                  uri,
                  width: 1000,
                  height: 1000,
                },
              ],
            })
          }, 1e3)
        })
      })
    }
  }

  return (
    <Dialog.Outer control={controls.tenMillion}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Ten Million`)}
        style={
          [
            // gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
          ]
        }>
        <View
          style={[
            a.relative,
            a.w_full,
            a.overflow_hidden,
            {
              paddingTop: '100%',
            },
          ]}>
          <ViewShot
            ref={imageRef}
            options={{width: 2e3, height: 2e3}}
            style={[a.absolute, a.inset_0]}>
            <View
              style={[
                a.absolute,
                a.inset_0,
                a.align_center,
                a.justify_center,
                {
                  top: -1,
                  bottom: -1,
                  left: -1,
                  right: -1,
                },
              ]}>
              <GradientFill gradient={tokens.gradients.midnight} />

              <Text>10 milly, babyyy</Text>
            </View>
          </ViewShot>
        </View>

        <Button
          label={_(msg`Generate`)}
          size="medium"
          variant="solid"
          color="primary"
          onPress={share}>
          <ButtonText>{_(msg`Generate`)}</ButtonText>
        </Button>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
