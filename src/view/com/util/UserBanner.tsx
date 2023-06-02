import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {Image} from 'expo-image'
import {colors} from 'lib/styles'
import {openCamera, openCropper, openPicker} from '../../../lib/media/picker'
import {useStores} from 'state/index'
import {
  usePhotoLibraryPermission,
  useCameraPermission,
} from 'lib/hooks/usePermissions'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'
import {AvatarModeration} from 'lib/labeling/types'
import {isWeb, isAndroid} from 'platform/detection'
import {Image as RNImage} from 'react-native-image-crop-picker'

export function UserBanner({
  banner,
  moderation,
  onSelectNewBanner,
}: {
  banner?: string | null
  moderation?: AvatarModeration
  onSelectNewBanner?: (img: RNImage | null) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()

  const dropdownItems = [
    !isWeb && {
      testID: 'changeBannerCameraBtn',
      label: 'Camera',
      icon: 'camera' as IconProp,
      onPress: async () => {
        if (!(await requestCameraAccessIfNeeded())) {
          return
        }
        onSelectNewBanner?.(
          await openCamera(store, {
            width: 3000,
            height: 1000,
          }),
        )
      },
    },
    {
      testID: 'changeBannerLibraryBtn',
      label: 'Library',
      icon: 'image' as IconProp,
      onPress: async () => {
        if (!(await requestPhotoAccessIfNeeded())) {
          return
        }
        const items = await openPicker(store)

        onSelectNewBanner?.(
          await openCropper(store, {
            mediaType: 'photo',
            path: items[0].path,
            width: 3000,
            height: 1000,
          }),
        )
      },
    },
    !!banner && {
      testID: 'changeBannerRemoveBtn',
      label: 'Remove',
      icon: ['far', 'trash-can'] as IconProp,
      onPress: () => {
        onSelectNewBanner?.(null)
      },
    },
  ]

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <DropdownButton
      testID="changeBannerBtn"
      type="bare"
      items={dropdownItems}
      openToRight
      rightOffset={-200}
      bottomOffset={-10}
      menuWidth={170}>
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
          style={[styles.bannerImage, styles.defaultBanner]}
        />
      )}
      <View style={[styles.editButtonContainer, pal.btn]}>
        <FontAwesomeIcon
          icon="camera"
          size={12}
          style={{color: colors.white}}
          color={pal.text.color as string}
        />
      </View>
    </DropdownButton>
  ) : banner &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <Image
      testID="userBannerImage"
      style={styles.bannerImage}
      resizeMode="cover"
      source={{uri: banner}}
      blurRadius={moderation?.blur ? 100 : 0}
      accessible={true}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      testID="userBannerFallback"
      style={[styles.bannerImage, styles.defaultBanner]}
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
  defaultBanner: {
    backgroundColor: '#0070ff',
  },
})
