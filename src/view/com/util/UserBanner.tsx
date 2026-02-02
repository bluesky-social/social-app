import {useCallback, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Image} from 'expo-image'
import {type ModerationUI} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {compressIfNeeded} from '#/lib/media/manip'
import {openCamera, openCropper, openPicker} from '#/lib/media/picker'
import {type PickerImage} from '#/lib/media/picker.shared'
import {isCancelledError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  type ComposerImage,
  compressImage,
  createComposerImage,
} from '#/state/gallery'
import {EditImageDialog} from '#/view/com/composer/photos/EditImageDialog'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, tokens, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon,
  Camera_Stroke2_Corner0_Rounded as CameraIcon,
} from '#/components/icons/Camera'
import {StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {IS_ANDROID, IS_NATIVE} from '#/env'

export function UserBanner({
  type,
  banner,
  moderation,
  onSelectNewBanner,
}: {
  type?: 'labeler' | 'default'
  banner?: string | null
  moderation?: ModerationUI
  onSelectNewBanner?: (img: PickerImage | null) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const [rawImage, setRawImage] = useState<ComposerImage | undefined>()
  const editImageDialogControl = useDialogControl()

  const onOpenCamera = useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }
    onSelectNewBanner?.(
      await compressIfNeeded(
        await openCamera({
          aspect: [3, 1],
        }),
      ),
    )
  }, [onSelectNewBanner, requestCameraAccessIfNeeded])

  const onOpenLibrary = useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await sheetWrapper(openPicker())
    if (!items[0]) {
      return
    }

    try {
      if (IS_NATIVE) {
        onSelectNewBanner?.(
          await compressIfNeeded(
            await openCropper({
              imageUri: items[0].path,
              aspectRatio: 3 / 1,
            }),
          ),
        )
      } else {
        setRawImage(await createComposerImage(items[0]))
        editImageDialogControl.open()
      }
    } catch (e) {
      // Don't log errors for cancelling selection to sentry on ios or android
      if (!isCancelledError(e)) {
        logger.error('Failed to crop banner', {error: e})
      }
    }
  }, [
    onSelectNewBanner,
    requestPhotoAccessIfNeeded,
    sheetWrapper,
    editImageDialogControl,
  ])

  const onRemoveBanner = useCallback(() => {
    onSelectNewBanner?.(null)
  }, [onSelectNewBanner])

  const onChangeEditImage = useCallback(
    async (image: ComposerImage) => {
      const compressed = await compressImage(image)
      onSelectNewBanner?.(compressed)
    },
    [onSelectNewBanner],
  )

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <>
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
                <View
                  style={[
                    styles.editButtonContainer,
                    t.atoms.bg_contrast_25,
                    a.border,
                    t.atoms.border_contrast_low,
                  ]}>
                  <CameraFilledIcon
                    height={14}
                    width={14}
                    style={t.atoms.text}
                  />
                </View>
              </Pressable>
            )}
          </Menu.Trigger>
          <Menu.Outer showCancel>
            <Menu.Group>
              {IS_NATIVE && (
                <Menu.Item
                  testID="changeBannerCameraBtn"
                  label={_(msg`Upload from Camera`)}
                  onPress={onOpenCamera}>
                  <Menu.ItemText>
                    <Trans>Upload from Camera</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={CameraIcon} />
                </Menu.Item>
              )}

              <Menu.Item
                testID="changeBannerLibraryBtn"
                label={_(msg`Upload from Library`)}
                onPress={onOpenLibrary}>
                <Menu.ItemText>
                  {IS_NATIVE ? (
                    <Trans>Upload from Library</Trans>
                  ) : (
                    <Trans>Upload from Files</Trans>
                  )}
                </Menu.ItemText>
                <Menu.ItemIcon icon={LibraryIcon} />
              </Menu.Item>
            </Menu.Group>
            {!!banner && (
              <>
                <Menu.Divider />
                <Menu.Group>
                  <Menu.Item
                    testID="changeBannerRemoveBtn"
                    label={_(msg`Remove Banner`)}
                    onPress={onRemoveBanner}>
                    <Menu.ItemText>
                      <Trans>Remove Banner</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={TrashIcon} />
                  </Menu.Item>
                </Menu.Group>
              </>
            )}
          </Menu.Outer>
        </Menu.Root>
      </EventStopper>

      <EditImageDialog
        control={editImageDialogControl}
        image={rawImage}
        onChange={onChangeEditImage}
        aspectRatio={3}
      />
    </>
  ) : banner &&
    !((moderation?.blur && IS_ANDROID) /* android crashes with blur */) ? (
    <Image
      testID="userBannerImage"
      style={[styles.bannerImage, t.atoms.bg_contrast_25]}
      contentFit="cover"
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
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  labelerBanner: {
    backgroundColor: tokens.color.temp_purple,
  },
})
