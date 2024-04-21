import React from 'react'
import {Keyboard, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {isAndroid} from '#/platform/detection'
import {ServerInputDialog} from '#/view/com/auth/server-input'
import {atoms as a, useTheme} from '#/alf'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {PencilLine_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import {Button} from '../Button'
import {useDialogControl} from '../Dialog'
import {Text} from '../Typography'

export function HostingProvider({
  serviceUrl,
  onSelectServiceUrl,
  onOpenDialog,
}: {
  serviceUrl: string
  onSelectServiceUrl: (provider: string) => void
  onOpenDialog?: () => void
}) {
  const serverInputControl = useDialogControl()
  const t = useTheme()
  const {_} = useLingui()

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
    serverInputControl.open()
    if (onOpenDialog) {
      onOpenDialog()
    }
  }, [onOpenDialog, serverInputControl])

  return (
    <>
      <ServerInputDialog
        control={serverInputControl}
        onSelect={onSelectServiceUrl}
      />
      <Button
        testID="selectServiceButton"
        label={toNiceDomain(serviceUrl)}
        accessibilityHint={_(msg`Press to change hosting provider`)}
        variant="solid"
        color="secondary"
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.rounded_sm,
          a.px_md,
          a.pr_sm,
          a.gap_xs,
          {paddingVertical: isAndroid ? 14 : 9},
        ]}
        onPress={onPressSelectService}>
        {({hovered, pressed}) => {
          const interacted = hovered || pressed
          return (
            <>
              <View style={a.pr_xs}>
                <Globe
                  size="md"
                  fill={
                    interacted ? t.palette.contrast_800 : t.palette.contrast_500
                  }
                />
              </View>
              <Text style={[a.text_md]}>{toNiceDomain(serviceUrl)}</Text>
              <View
                style={[
                  a.rounded_sm,
                  interacted
                    ? t.atoms.bg_contrast_300
                    : t.atoms.bg_contrast_100,
                  {marginLeft: 'auto', padding: 6},
                ]}>
                <Pencil
                  size="sm"
                  style={{
                    color: interacted
                      ? t.palette.contrast_800
                      : t.palette.contrast_500,
                  }}
                />
              </View>
            </>
          )
        }}
      </Button>
    </>
  )
}
