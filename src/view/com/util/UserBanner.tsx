import React from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import Image from 'view/com/util/images/Image'
import {colors, gradients} from 'lib/styles'
import {
  openCamera,
  openCropper,
  openPicker,
  PickedMedia,
} from '../../../lib/media/picker'
import {useStores} from 'state/index'
import {
  requestPhotoAccessIfNeeded,
  requestCameraAccessIfNeeded,
} from 'lib/permissions'
import {DropdownButton} from './forms/DropdownButton'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'

export function UserBanner({
  banner,
  onSelectNewBanner,
}: {
  banner?: string | null
  onSelectNewBanner?: (img: PickedMedia) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const dropdownItems = [
    !isWeb && {
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
    // TODO: Remove banner https://github.com/bluesky-social/social-app/issues/122
    // {
    //   label: 'Remove',
    //   icon: ['far', 'trash-can'],
    //   onPress: () => {
    //     // Remove banner api call
    //   },
    // },
  ]

  const renderSvg = () => (
    <Svg width="100%" height="150" viewBox="50 0 200 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop
            offset="0"
            stopColor={gradients.blueDark.start}
            stopOpacity="1"
          />
          <Stop offset="1" stopColor={gradients.blueDark.end} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad)" />
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad2)" />
    </Svg>
  )

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <DropdownButton
      type="bare"
      items={dropdownItems}
      openToRight
      rightOffset={-200}
      bottomOffset={-10}
      menuWidth={170}>
      {banner ? (
        <Image style={styles.bannerImage} source={{uri: banner}} />
      ) : (
        renderSvg()
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
      style={styles.bannerImage}
      resizeMode="cover"
      source={{uri: banner}}
    />
  ) : (
    renderSvg()
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
})
