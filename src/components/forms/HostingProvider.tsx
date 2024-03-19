import React from 'react'
import {TouchableOpacity, View} from 'react-native'

import {isAndroid} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {PencilLine_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import * as TextField from './TextField'
import {useDialogControl} from '../Dialog'
import {Text} from '../Typography'
import {ServerInputDialog} from '#/view/com/auth/server-input'
import {toNiceDomain} from '#/lib/strings/url-helpers'

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

  const onPressSelectService = React.useCallback(() => {
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
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.rounded_sm,
          a.px_md,
          a.gap_xs,
          {paddingVertical: isAndroid ? 14 : 9},
          t.atoms.bg_contrast_25,
        ]}
        onPress={onPressSelectService}>
        <TextField.Icon icon={Globe} />
        <Text style={[a.text_md]}>{toNiceDomain(serviceUrl)}</Text>
        <View
          style={[
            a.rounded_sm,
            t.atoms.bg_contrast_100,
            {marginLeft: 'auto', left: 6, padding: 6},
          ]}>
          <Pencil
            style={{color: t.palette.contrast_500}}
            height={18}
            width={18}
          />
        </View>
      </TouchableOpacity>
    </>
  )
}
