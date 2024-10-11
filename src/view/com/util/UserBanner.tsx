import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {Image} from 'expo-image'
import {ModerationUI} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {colors} from '#/lib/styles'
import {useTheme} from '#/lib/ThemeContext'
import {logger} from '#/logger'
import {isAndroid, isNative} from '#/platform/detection'
import {EventStopper} from '#/view/com/util/EventStopper'
import {tokens, useTheme as useAlfTheme} from '#/alf'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilled,
  Camera_Stroke2_Corner0_Rounded as Camera,
} from '#/components/icons/Camera'
import {StreamingLive_Stroke2_Corner0_Rounded as Library} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {openCamera, openCropper, openPicker} from '../../../lib/media/picker'

export function UserBanner({
  type,
  banner,
  moderation,
  onSelectNewBanner,
}: {
  type?: 'labeler' | 'default'
  banner?: string | null
  moderation?: ModerationUI
  onSelectNewBanner?: (img: RNImage | null) => void
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const t = useAlfTheme()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const sheetWrapper = useSheetWrapper()

  const onOpenCamera = React.useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }
    onSelectNewBanner?.(
      await openCamera({
        width: 3000,
        height: 1000,
      }),
    )
  }, [onSelectNewBanner, requestCameraAccessIfNeeded])

  const onOpenLibrary = React.useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await sheetWrapper(openPicker())
    if (!items[0]) {
      return
    }

    try {
      onSelectNewBanner?.(
        await openCropper({
          mediaType: 'photo',
          path: items[0].path,
          width: 3000,
          height: 1000,
          webAspectRatio: 3,
        }),
      )
    } catch (e: any) {
      if (!String(e).includes('Canceled')) {
        logger.error('Failed to crop banner', {error: e})
      }
    }
  }, [onSelectNewBanner, requestPhotoAccessIfNeeded, sheetWrapper])

  const onRemoveBanner = React.useCallback(() => {
    onSelectNewBanner?.(null)
  }, [onSelectNewBanner])

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <EventStopper onKeyDown={true}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Edit avatar`)}>
          {({props}) => (
            <Pressable {...props} testID="changeBannerBtn">
              {banner ? (
                <Image
                  testID="userBannerImage"
                  style={styles.bannerImage}
                  source={{uri: banner}}
                  accessible={true}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  testID="userBannerFallback"
                  style={[styles.bannerImage, t.atoms.bg_contrast_25]}
                />
              )}
              <View style={[styles.editButtonContainer, pal.btn]}>
                <CameraFilled height={14} width={14} style={t.atoms.text} />
              </View>
            </Pressable>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            {isNative && (
              <Menu.Item
                testID="changeBannerCameraBtn"
                label={_(msg`Upload from Camera`)}
                onPress={onOpenCamera}>
                <Menu.ItemText>
                  <Trans>Upload from Camera</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={Camera} />
              </Menu.Item>
            )}

            <Menu.Item
              testID="changeBannerLibraryBtn"
              label={_(msg`Upload from Library`)}
              onPress={onOpenLibrary}>
              <Menu.ItemText>
                {isNative ? (
                  <Trans>Upload from Library</Trans>
                ) : (
                  <Trans>Upload from Files</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon icon={Library} />
            </Menu.Item>
          </Menu.Group>
          {!!banner && (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  testID="changeBannerRemoveBtn"
                  label={_(`Remove Banner`)}
                  onPress={onRemoveBanner}>
                  <Menu.ItemText>
                    <Trans>Remove Banner</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={Trash} />
                </Menu.Item>
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : banner &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <Image
      testID="userBannerImage"
      style={[
        styles.bannerImage,
        {backgroundColor: theme.palette.default.backgroundLight},
      ]}
      resizeMode="cover"
      source={{uri: banner}}
      blurRadius={moderation?.blur ? 100 : 0}
      accessible={true}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      testID="userBannerFallback"
      style={[
        styles.bannerImage,
        type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 8,
    right: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  labelerBanner: {
    backgroundColor: tokens.color.temp_purple,
  },
})
