import React from 'react'
import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {ServerInputDialog} from '#/view/com/auth/server-input'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
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
          variant="solid"
          color="secondary"
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.rounded_sm,
            a.py_sm,
            a.pl_md,
            a.pr_sm,
            a.gap_xs,
          ]}
          onPress={onPressSelectService}>
          {({hovered, pressed}) => {
            const interacted = hovered || pressed
            return (
              <>
                <View style={a.pr_xs}>
                  <GlobeIcon
                    size="md"
                    fill={
                      interacted
                        ? t.palette.contrast_800
                        : t.palette.contrast_500
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
                  <PencilIcon
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
      )}
    </>
  )
}
