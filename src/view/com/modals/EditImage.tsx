import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {gradients, s} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../util/text/Text'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import ImageEditor, {Position} from 'react-avatar-editor'
import {TextInput} from './util'
import {enforceLen} from 'lib/strings/helpers'
import {MAX_ALT_TEXT} from 'lib/constants'
import {GalleryModel} from 'state/models/media/gallery'
import {ImageModel} from 'state/models/media/image'
import {SquareIcon, RectWideIcon, RectTallIcon} from 'lib/icons'
import {Slider} from '@miblanchard/react-native-slider'
import {MaterialIcons} from '@expo/vector-icons'
import {observer} from 'mobx-react-lite'
import {getKeys} from 'lib/type-assertions'

export const snapPoints = ['80%']

interface Props {
  image: ImageModel
  gallery: GalleryModel
}

// This is only used for desktop web
export const Component = observer(function ({image, gallery}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const {shell} = store
  const theme = useTheme()

  const [altText, setAltText] = useState(image.altText)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    image.aspectRatio ?? '1:1',
  )
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(
    image.flipHorizontal ?? false,
  )
  const [flipVertical, setFlipVertical] = useState<boolean>(
    image.flipVertical ?? false,
  )

  // TODO: doesn't seem to be working correctly with crop
  // const [rotation, setRotation] = useState(image.rotation ?? 0)
  const [scale, setScale] = useState<number>(image.scale ?? 1)
  const [position, setPosition] = useState<Position>()
  const [isEditing, setIsEditing] = useState(false)
  const editorRef = useRef<ImageEditor>(null)

  const manipulationAttributes = useMemo(
    () => ({
      // TODO: doesn't seem to be working correctly with crop
      // ...(rotation !== undefined ? {rotate: rotation} : {}),
      ...(flipHorizontal !== undefined ? {flipHorizontal} : {}),
      ...(flipVertical !== undefined ? {flipVertical} : {}),
    }),
    [flipHorizontal, flipVertical],
  )

  useEffect(() => {
    const manipulateImage = async () => {
      await image.manipulate(manipulationAttributes)
    }

    manipulateImage()
  }, [image, manipulationAttributes])

  const ratios = useMemo(
    () =>
      ({
        '4:3': {
          hint: 'Sets image aspect ratio to wide',
          Icon: RectWideIcon,
        },
        '1:1': {
          hint: 'Sets image aspect ratio to square',
          Icon: SquareIcon,
        },
        '3:4': {
          hint: 'Sets image aspect ratio to tall',
          Icon: RectTallIcon,
        },
        None: {
          label: 'None',
          hint: 'Sets image aspect ratio to tall',
          Icon: MaterialIcons,
          name: 'do-not-disturb-alt',
        },
      } as const),
    [],
  )

  type AspectRatio = keyof typeof ratios

  const onFlipHorizontal = useCallback(() => {
    setFlipHorizontal(!flipHorizontal)
    image.manipulate({flipHorizontal})
  }, [flipHorizontal, image])

  const onFlipVertical = useCallback(() => {
    setFlipVertical(!flipVertical)
    image.manipulate({flipVertical})
  }, [flipVertical, image])

  const adjustments = useMemo(
    () =>
      [
        // {
        //   name: 'rotate-left',
        //   label: 'Rotate left',
        //   hint: 'Rotate image left',
        //   onPress: () => {
        //     const rotate = (rotation - 90) % 360
        //     setRotation(rotate)
        //     image.manipulate({rotate})
        //   },
        // },
        // {
        //   name: 'rotate-right',
        //   label: 'Rotate right',
        //   hint: 'Rotate image right',
        //   onPress: () => {
        //     const rotate = (rotation + 90) % 360
        //     setRotation(rotate)
        //     image.manipulate({rotate})
        //   },
        // },
        {
          name: 'flip',
          label: 'Flip horizontal',
          hint: 'Flip image horizontally',
          onPress: onFlipHorizontal,
        },
        {
          name: 'flip',
          label: 'Flip vertically',
          hint: 'Flip image vertically',
          onPress: onFlipVertical,
        },
      ] as const,
    [onFlipHorizontal, onFlipVertical],
  )

  useEffect(() => {
    image.prev = image.compressed
    setIsEditing(true)
  }, [image])

  const onCloseModal = useCallback(() => {
    shell.closeModal()
    setIsEditing(false)
  }, [shell])

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
      ...manipulationAttributes,
      aspectRatio,
    })

    image.prevAttributes = manipulationAttributes
    onCloseModal()
  }, [
    altText,
    aspectRatio,
    image,
    manipulationAttributes,
    position,
    scale,
    onCloseModal,
  ])

  const onPressRatio = useCallback((as: AspectRatio) => {
    setAspectRatio(as)
  }, [])

  const getLabelIconSize = useCallback((as: AspectRatio) => {
    switch (as) {
      case 'None':
        return 22
      case '1:1':
        return 32
      default:
        return 26
    }
  }, [])

  // Prevents preliminary flash when transformations are being applied
  if (image.compressed === undefined) {
    return null
  }

  const {width, height} = image.getDisplayDimensions(aspectRatio, 300)

  return (
    <View testID="editImageModal" style={[pal.view, styles.container, s.flex1]}>
      <Text style={[styles.title, pal.text]}>Edit image</Text>
      <View style={[styles.section, styles.leftSection, s.flexRow]}>
        <View>
          <View style={[styles.imgContainer]}>
            <ImageEditor
              ref={editorRef}
              style={styles.imgEditor}
              image={isEditing ? image.compressed.path : image.path}
              width={width}
              height={height}
              scale={scale}
              border={0}
              position={position}
              onPositionChange={setPosition}
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
        <View style={styles.section}>
          <View style={styles.subsection}>
            <Text type="sm-bold" style={[pal.text]}>
              Ratios
            </Text>
            <View style={styles.imgControls}>
              {getKeys(ratios).map(ratio => {
                const {hint, Icon, ...props} = ratios[ratio]
                const labelIconSize = getLabelIconSize(ratio)
                const isSelected = aspectRatio === ratio

                return (
                  <Pressable
                    key={ratio}
                    onPress={() => {
                      onPressRatio(ratio)
                    }}
                    accessibilityLabel={ratio}
                    accessibilityHint={hint}>
                    <Icon
                      size={labelIconSize}
                      style={[
                        styles.imgControl,
                        isSelected ? s.blue3 : pal.text,
                      ]}
                      color={(isSelected ? s.blue3 : pal.text).color}
                      {...props}
                    />

                    <Text
                      type={isSelected ? 'xs-bold' : 'xs-medium'}
                      style={[isSelected ? s.blue3 : pal.text, s.textCenter]}>
                      {ratio}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
          <View style={styles.subsection}>
            <Text type="sm-bold" style={[pal.text]}>
              Adjustments
            </Text>
            <View style={styles.imgControls}>
              {adjustments.map(({label, hint, name, onPress}) => (
                <Pressable
                  key={label}
                  onPress={onPress}
                  accessibilityLabel={label}
                  accessibilityHint={hint}>
                  <MaterialIcons
                    name={name}
                    size={label.startsWith('Flip') ? 22 : 24}
                    style={[
                      pal.text,
                      label === 'Flip vertically'
                        ? styles.flipVertical
                        : undefined,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.section, styles.altTextSection, pal.border]}>
        <Text type="sm-bold" style={[pal.text]}>
          Accessibility
        </Text>
        <TextInput
          testID="altTextImageInput"
          style={[styles.textArea, pal.border, pal.text]}
          keyboardAppearance={theme.colorScheme}
          multiline
          value={altText}
          onChangeText={text => setAltText(enforceLen(text, MAX_ALT_TEXT))}
          accessibilityLabel="Image alt text"
          accessibilityHint="Sets image alt text for screenreaders"
          accessibilityLabelledBy="imageAltText"
        />
      </View>
      <View style={styles.btns}>
        <Pressable onPress={onPressCancel} accessibilityRole="button">
          <Text type="xl" style={pal.link}>
            Cancel
          </Text>
        </Pressable>
        <Pressable onPress={onPressSave} accessibilityRole="button">
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text type="xl-medium" style={s.white}>
              Done
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
})

const LHS_DIMENSION = 300

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    height: '100%',
    width: '100%',
  },
  section: {
    gap: 18,
  },
  subsection: {
    gap: 10,
  },
  leftSection: {
    gap: 12,
    width: LHS_DIMENSION,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
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
  img: {
    height: LHS_DIMENSION,
    width: LHS_DIMENSION,
  },
  altTextSection: {
    borderTopWidth: 1,
    flexDirection: 'column',
    paddingTop: 24,
  },
  imgControls: {
    flexDirection: 'row',
    gap: 5,
  },
  imgControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  flipVertical: {
    transform: [{rotate: '90deg'}],
  },
  imgEditor: {
    maxWidth: '100%',
  },
  imgContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    borderWidth: 1,
    borderStyle: 'solid',
  },
})
