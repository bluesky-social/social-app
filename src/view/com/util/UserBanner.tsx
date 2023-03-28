import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import Image from 'view/com/util/images/Image'
import {colors} from 'lib/styles'
import {
  openCamera,
  openCropper,
  openPicker,
  PickedMedia,
} from '../../../lib/media/picker'
import {useStores} from 'state/index'
import {
  usePhotoLibraryPermission,
  useCameraPermission,
} from 'lib/hooks/usePermissions'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'

export function UserBanner({
  banner,
  onSelectNewBanner,
}: {
  banner?: string | null
  onSelectNewBanner?: (img: PickedMedia | null) => void
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
            mediaType: 'photo',
            // compressImageMaxWidth: 3000, TODO needed?
            width: 3000,
            // compressImageMaxHeight: 1000, TODO needed?
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
        const items = await openPicker(store, {
          mediaType: 'photo',
        })
        onSelectNewBanner?.(
          await openCropper(store, {
            mediaType: 'photo',
            path: items[0].path,
            // compressImageMaxWidth: 3000, TODO needed?
            width: 3000,
            // compressImageMaxHeight: 1000, TODO needed?
            height: 1000,
          }),
        )
      },
    },
    {
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
  ) : banner ? (
    <Image
      testID="userBannerImage"
      style={styles.bannerImage}
      resizeMode="cover"
      source={{uri: banner}}
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
    right: 8,
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
