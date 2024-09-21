import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {useWindowDimensions} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Slider} from '@miblanchard/react-native-slider'
import {observer} from 'mobx-react-lite'
import ImageEditor, {Position} from 'react-avatar-editor'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {enforceLen} from '#/lib/strings/helpers'
import {gradients, s} from '#/lib/styles'
import {useTheme} from '#/lib/ThemeContext'
import {getKeys} from '#/lib/type-assertions'
import {useModalControls} from '#/state/modals'
import {GalleryModel} from '#/state/models/media/gallery'
import {ImageModel} from '#/state/models/media/image'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  AspectRatio11_Stroke2_Corner0_Rounded as A11,
  AspectRatio34_Stroke2_Corner0_Rounded as A34,
  AspectRatio43_Stroke2_Corner0_Rounded as A43,
} from '#/components/icons/AspectRatio'
import {CircleBanSign_Stroke2_Corner0_Rounded as Ban} from '#/components/icons/CircleBanSign'
import {
  FlipHorizontal_Stroke2_Corner0_Rounded as FlipHorizontal,
  FlipVertical_Stroke2_Corner0_Rounded as FlipVertical,
} from '#/components/icons/FlipImage'
import {Text} from '../util/text/Text'
import {TextInput} from './util'

export const snapPoints = ['80%']

const RATIOS = {
  '4:3': {
    icon: A43,
  },
  '1:1': {
    icon: A11,
  },
  '3:4': {
    icon: A34,
  },
  None: {
    icon: Ban,
  },
} as const

type AspectRatio = keyof typeof RATIOS

interface Props {
  image: ImageModel
  gallery: GalleryModel
}

export const Component = observer(function EditImageImpl({
  image,
  gallery,
}: Props) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {_} = useLingui()
  const windowDimensions = useWindowDimensions()
  const {isMobile} = useWebMediaQueries()
  const {closeModal} = useModalControls()

  const {
    aspectRatio,
    // rotate = 0
  } = image.attributes

  const editorRef = useRef<ImageEditor>(null)
  const [scale, setScale] = useState<number>(image.attributes.scale ?? 1)
  const [position, setPosition] = useState<Position | undefined>(
    image.attributes.position,
  )
  const [altText, setAltText] = useState(image?.altText ?? '')

  const onFlipHorizontal = useCallback(() => {
    image.flipHorizontal()
  }, [image])

  const onFlipVertical = useCallback(() => {
    image.flipVertical()
  }, [image])

  // const onSetRotate = useCallback(
  //   (direction: 'left' | 'right') => {
  //     const rotation = (rotate + 90 * (direction === 'left' ? -1 : 1)) % 360
  //     image.setRotate(rotation)
  //   },
  //   [rotate, image],
  // )

  const onSetRatio = useCallback(
    (ratio: AspectRatio) => {
      image.setRatio(ratio)
    },
    [image],
  )

  const adjustments = useMemo(
    () => [
      // {
      //   name: 'rotate-left' as const,
      //   label: 'Rotate left',
      //   onPress: () => {
      //     onSetRotate('left')
      //   },
      // },
      // {
      //   name: 'rotate-right' as const,
      //   label: 'Rotate right',
      //   onPress: () => {
      //     onSetRotate('right')
      //   },
      // },
      {
        icon: FlipHorizontal,
        label: _(msg`Flip horizontal`),
        onPress: onFlipHorizontal,
      },
      {
        icon: FlipVertical,
        label: _(msg`Flip vertically`),
        onPress: onFlipVertical,
      },
    ],
    [onFlipHorizontal, onFlipVertical, _],
  )

  useEffect(() => {
    image.prev = image.cropped
    image.prevAttributes = image.attributes
    image.resetCropped()
  }, [image])

  const onCloseModal = useCallback(() => {
    closeModal()
  }, [closeModal])

  const onPressCancel = useCallback(async () => {
    await gallery.previous(image)
    onCloseModal()
  }, [onCloseModal, gallery, image])

  const onPressSave = useCallback(async () => {
    image.setAltText(altText)

    const crop = editorRef.current?.getCroppingRect()

    await image.manipulate({
      ...(crop !== undefined
        ? {
            crop: {
              originX: crop.x,
              originY: crop.y,
              width: crop.width,
              height: crop.height,
            },
            ...(scale !== 1 ? {scale} : {}),
            ...(position !== undefined ? {position} : {}),
          }
        : {}),
    })

    image.prev = image.cropped
    image.prevAttributes = image.attributes
    onCloseModal()
  }, [altText, image, position, scale, onCloseModal])

  if (image.cropped === undefined) {
    return null
  }

  const computedWidth =
    windowDimensions.width > 500 ? 410 : windowDimensions.width - 80
  const sideLength = isMobile ? computedWidth : 300

  const dimensions = image.getResizedDimensions(aspectRatio, sideLength)
  const imgContainerStyles = {width: sideLength, height: sideLength}

  const imgControlStyles = {
    alignItems: 'center' as const,
    flexDirection: isMobile ? ('column' as const) : ('row' as const),
    gap: isMobile ? 0 : 5,
  }

  return (
    <View
      testID="editImageModal"
      style={[
        pal.view,
        styles.container,
        s.flex1,
        {
          paddingHorizontal: isMobile ? 16 : undefined,
        },
      ]}>
      <Text style={[styles.title, pal.text]}>
        <Trans>Edit image</Trans>
      </Text>
      <View style={[styles.gap18, s.flexRow]}>
        <View>
          <View
            style={[styles.imgContainer, pal.borderDark, imgContainerStyles]}>
            <ImageEditor
              ref={editorRef}
              style={styles.imgEditor}
              image={image.cropped.path}
              scale={scale}
              border={0}
              position={position}
              onPositionChange={setPosition}
              {...dimensions}
            />
          </View>
          <Slider
            value={scale}
            onValueChange={(v: number | number[]) =>
              setScale(Array.isArray(v) ? v[0] : v)
            }
            minimumValue={1}
            maximumValue={3}
          />
        </View>
        <View style={[a.gap_sm]}>
          {!isMobile ? (
            <Text type="sm-bold" style={pal.text}>
              <Trans>Ratios</Trans>
            </Text>
          ) : null}
          <View style={imgControlStyles}>
            {getKeys(RATIOS).map(ratio => {
              const {icon} = RATIOS[ratio]
              const isSelected = aspectRatio === ratio

              return (
                <Button
                  key={ratio}
                  label={ratio}
                  size="large"
                  shape="square"
                  variant="outline"
                  color={isSelected ? 'primary' : 'secondary'}
                  onPress={() => {
                    onSetRatio(ratio)
                  }}>
                  <View style={[a.align_center, a.gap_2xs]}>
                    <ButtonIcon icon={icon} />
                    <ButtonText style={[a.text_xs]}>{ratio}</ButtonText>
                  </View>
                </Button>
              )
            })}
          </View>
          {!isMobile ? (
            <Text type="sm-bold" style={[pal.text, styles.subsection]}>
              <Trans>Transformations</Trans>
            </Text>
          ) : null}
          <View style={imgControlStyles}>
            {adjustments.map(({label, icon, onPress}) => (
              <Button
                key={label}
                label={label}
                size="large"
                shape="square"
                variant="outline"
                color="secondary"
                onPress={onPress}>
                <ButtonIcon icon={icon} />
              </Button>
            ))}
          </View>
        </View>
      </View>
      <View style={[styles.gap18, styles.bottomSection, pal.border]}>
        <Text type="sm-bold" style={pal.text} nativeID="alt-text">
          <Trans>Accessibility</Trans>
        </Text>
        <TextInput
          testID="altTextImageInput"
          style={[
            styles.textArea,
            pal.border,
            pal.text,
            {
              maxHeight: isMobile ? 50 : undefined,
            },
          ]}
          keyboardAppearance={theme.colorScheme}
          multiline
          value={altText}
          onChangeText={text => setAltText(enforceLen(text, MAX_ALT_TEXT))}
          accessibilityLabel={_(msg`Alt text`)}
          accessibilityHint=""
          accessibilityLabelledBy="alt-text"
        />
      </View>
      <View style={styles.btns}>
        <Pressable onPress={onPressCancel} accessibilityRole="button">
          <Text type="xl" style={pal.link}>
            <Trans>Cancel</Trans>
          </Text>
        </Pressable>
        <Pressable onPress={onPressSave} accessibilityRole="button">
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text type="xl-medium" style={s.white}>
              <Trans context="action">Done</Trans>
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    gap: 18,
    height: '100%',
    width: '100%',
  },
  subsection: {marginTop: 12},
  gap18: {gap: 18},
  title: {
    fontWeight: '600',
    fontSize: 24,
  },
  btns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  imgEditor: {
    maxWidth: '100%',
  },
  imgContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: 4,
  },
  flipVertical: {
    transform: [{rotate: '90deg'}],
  },
  flipBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    paddingTop: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  bottomSection: {
    borderTopWidth: 1,
    paddingTop: 18,
  },
})
