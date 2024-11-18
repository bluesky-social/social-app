/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */
import React, {useCallback} from 'react'
import {Dimensions, View} from 'react-native'
import * as FS from 'expo-file-system'
import {Image} from 'expo-image'
import {Asset, AssetInfo, MediaType, PagedInfo} from 'expo-media-library'
import * as MediaLibrary from 'expo-media-library'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePhotoLibraryPermission} from '#/lib/hooks/usePermissions'
import {openPicker} from '#/lib/media/picker'
import {isNative} from '#/platform/detection'
import {ComposerImage, createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'
import {Text} from '#/components/Typography'

type Props = {
  size: number
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
}

export function SelectPhotoBtn({size, disabled, onAdd}: Props) {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()

  const control = useDialogControl()

  const onPressSelectPhotos = useCallback(async () => {
    control.open()

    // if (isNative && !(await requestPhotoAccessIfNeeded())) {
    //   return
    // }
    //
    // const images = await sheetWrapper(
    //   openPicker({
    //     selectionLimit: 4 - size,
    //     allowsMultipleSelection: true,
    //   }),
    // )
    //
    // if (images.length === 0) {
    //   return
    // }
    //
    // const results = await Promise.all(
    //   images.map(img => createComposerImage(img)),
    // )
    //
    // onAdd(results)
  }, [control])

  return (
    <Button
      testID="openGalleryBtn"
      onPress={onPressSelectPhotos}
      label={_(msg`Gallery`)}
      accessibilityHint={_(msg`Opens device photo gallery`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <ImageIcon size="lg" style={disabled && t.atoms.text_contrast_low} />
      <Dialog.Outer
        control={control}
        nativeOptions={{minHeight: Dimensions.get('window').height}}>
        <ImagePickerView control={control} />
      </Dialog.Outer>
    </Button>
  )
}

function ImagePickerView({control}: {control: Dialog.DialogControlProps}) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [pages, setPages] = React.useState<PagedInfo<Asset>[]>([])
  const [selections, setSelections] = React.useState<AssetInfo[]>([])

  const canPickMore = React.useMemo(() => {
    if (selections.length === 0) {
      return true
    }
    if (selections[0].mediaType === MediaType.video) {
      return false
    }
    if (selections[0].mediaType === MediaType.photo && selections[0]) {
      return selections.length < 4
    }
  }, [selections])

  React.useEffect(() => {
    ;(async () => {
      const items = await MediaLibrary.getAssetsAsync({
        first: 30,
        mediaType: [MediaType.video, MediaType.photo],
      })

      setPages([items])
      setIsLoading(false)
    })()
  }, [])

  const items = pages.flatMap(page => page.assets)
  const slices = items.reduce<Asset[][]>((acc, item, i) => {
    if (i % 3 === 0) {
      acc.push([item])
    } else {
      acc[acc.length - 1].push(item)
    }
    return acc
  }, [])

  return (
    <Dialog.ScrollableInner
      label=""
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header
          renderLeft={() => <CancelButton onPress={() => control.close()} />}
          renderRight={() => <SaveButton onPress={() => {}} disabled={true} />}
          style={[a.pb_sm]}>
          <Dialog.HeaderText>
            <Trans>Edit profile</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs, a.justify_center]}>
        {slices.map((slice, i) => (
          <ImagePickerRow key={i} items={slice} isFirstRow={i === 0} />
        ))}
      </View>
    </Dialog.ScrollableInner>
  )
}

function ImagePickerRow({
  items,
  isFirstRow,
}: {
  items: Asset[]
  isFirstRow: boolean
}) {
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
      {items.map((item, i) => (
        <ImagePickerItem
          key={item.id}
          item={item}
          index={i}
          isFirstRow={isFirstRow}
        />
      ))}
    </View>
  )
}

const IMAGE_WIDTH = Dimensions.get('window').width / 3 - 8

function ImagePickerItem({
  item,
  index,
  isFirstRow,
}: {
  item: Asset
  index: number
  isFirstRow: boolean
}) {
  const isVideo = item.mediaType === MediaType.video

  return (
    <View style={[{aspectRatio: 1, width: IMAGE_WIDTH}]}>
      <Image
        source={{uri: item.uri}}
        style={[
          a.flex_1,
          a.overflow_hidden,
          a.rounded_xs,
          isFirstRow && [
            index === 0
              ? {borderTopLeftRadius: 12}
              : index === 2
              ? {borderTopRightRadius: 12}
              : null,
          ],
        ]}
      />
      {isVideo ? (
        <View
          style={[
            a.absolute,
            {
              right: 0,
              bottom: 0,
            },
          ]}>
          <View
            style={[
              a.flex_row,
              a.rounded_xs,
              a.gap_xs,
              a.align_center,
              a.mr_xs,
              a.mb_xs,
              {backgroundColor: 'rgba(0,0,0,0.5)', padding: 4},
            ]}>
            <PlayIcon
              width={12}
              style={[a.relative, a.z_10, {color: 'white'}]}
            />
            <Text style={[a.font_bold, {color: 'white'}]}>
              {Math.floor(item.duration / 60)}:
              {Math.floor(item.duration % 60)
                .toString()
                .padStart(2, '0')}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

function SaveButton({
  onPress,
  disabled,
}: {
  onPress: () => void
  disabled: boolean
}) {
  const {_} = useLingui()

  return (
    <Button
      label={_(msg`Select`)}
      onPress={onPress}
      size="small"
      color="primary"
      variant="ghost"
      style={[a.rounded_full]}
      disabled={disabled}>
      <ButtonText style={[a.text_md]}>
        <Trans>Select</Trans>
      </ButtonText>
    </Button>
  )
}

function CancelButton({onPress}: {onPress: () => void}) {
  const {_} = useLingui()

  return (
    <Button
      label={_(msg`Cancel`)}
      onPress={onPress}
      size="small"
      color="primary"
      variant="ghost"
      style={[a.rounded_full]}>
      <ButtonText style={[a.text_md]}>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}
