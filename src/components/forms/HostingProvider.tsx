import React from 'react'
import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {ServerInputDialog} from '#/view/com/auth/server-input'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {PencilLine_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {Text} from '#/components/Typography'

export function HostingProvider({
  serviceUrl,
  onSelectServiceUrl,
  onOpenDialog,
  minimal,
}: {
  serviceUrl: string
  onSelectServiceUrl: (provider: string) => void
  onOpenDialog?: () => void
  minimal?: boolean
}) {
  const serverInputControl = useDialogControl()
  const t = useTheme()
  const {_} = useLingui()

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
    serverInputControl.open()
    onOpenDialog?.()
  }, [onOpenDialog, serverInputControl])

  return (
    <>
      <ServerInputDialog
        control={serverInputControl}
        onSelect={onSelectServiceUrl}
      />
      {minimal ? (
        <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_xs]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>You are creating an account on</Trans>
          </Text>
          <Button
            label={toNiceDomain(serviceUrl)}
            accessibilityHint={_(msg`Changes hosting provider`)}
            onPress={onPressSelectService}
            variant="ghost"
            color="secondary"
            size="tiny"
            style={[
              a.px_xs,
              {marginHorizontal: tokens.space.xs * -1},
              {paddingVertical: 0},
            ]}>
            <ButtonText style={[a.text_sm]}>
              {toNiceDomain(serviceUrl)}
            </ButtonText>
            <ButtonIcon icon={PencilIcon} />
          </Button>
        </View>
      ) : (
        <Button
          testID="selectServiceButton"
          label={toNiceDomain(serviceUrl)}
          accessibilityHint={_(msg`Changes hosting provider`)}
          style={[a.w_full, a.flex_row, a.align_center, a.rounded_sm, a.gap_xs]}
          onPress={onPressSelectService}>
          <>
            <View style={[a.pb_s10, a.pt_s6, a.flex_1, a.px_md]}>
              <TextField.LabelText>
                <Trans>Account Provider</Trans>
              </TextField.LabelText>
              <Text style={[a.text_md, a.flex_1]}>
                {toNiceDomain(serviceUrl)}
              </Text>
            </View>
            <Button
              testID="Edit"
              disabled={true}
              onPress={onOpenDialog}
              label={_(msg`Edit`)}
              style={a.pr_md}
              accessibilityHint={_(msg`Edit`)}
              variant="ghost"
              color="link">
              <ButtonText>
                <Trans>Edit</Trans>
              </ButtonText>
            </Button>
          </>
        </Button>
      )}
      <View
        style={[
          {zIndex: -122},
          a.absolute,
          a.inset_0,
          a.rounded_sm,
          {borderColor: '#9B9B9B', borderWidth: 1},
        ]}
      />
    </>
  )
}
