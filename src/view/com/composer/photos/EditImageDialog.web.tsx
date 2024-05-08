import 'react-image-crop/dist/ReactCrop.css'

import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import ReactCrop, {PixelCrop} from 'react-image-crop'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {EditImageDialogProps} from './EditImageDialog'

export const EditImageDialog = (props: EditImageDialogProps) => {
  return (
    <Dialog.Outer control={props.control}>
      <EditImageInner key={props.image.source.id} {...props} />
    </Dialog.Outer>
  )
}

const EditImageInner = ({control, image, onChange}: EditImageDialogProps) => {
  const {_} = useLingui()
  const t = useTheme()

  const source = image.source
  const manips = image.manips

  const {initialCrop, initialAspect, sourceAspect} = React.useMemo(() => {
    const initialArea = manips?.crop

    let crop: PixelCrop | undefined

    if (initialArea) {
      crop = {
        unit: 'px',
        x: initialArea.originX,
        y: initialArea.originY,
        width: initialArea.width,
        height: initialArea.height,
      }
    }

    const originalAspect = source.width / source.height

    return {
      initialCrop: crop,
      initialAspect: crop ? crop.width / crop.height : originalAspect,
      sourceAspect: originalAspect,
    }
  }, [source, manips])

  const [crop, setCrop] = React.useState(initialCrop)
  const [aspect, setAspect] = React.useState(initialAspect)

  const isEmpty = !crop || (crop.width || crop.height) === 0
  const isNew = initialCrop ? true : !isEmpty

  const onPressSubmit = React.useCallback(async () => {
    const result = await manipulateImage(image, {
      crop: !isEmpty
        ? {
            originX: crop.x,
            originY: crop.y,
            width: crop.width,
            height: crop.height,
          }
        : undefined,
    })

    onChange(result)
    control.close()
  }, [crop, isEmpty, image, control, onChange])

  const changeAspect = (next: number) => {
    if (next !== aspect) {
      setAspect(next)
      setCrop(undefined)
    }
  }

  return (
    <Dialog.Inner label={_(msg`Edit image`)}>
      <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
        <Trans>Edit image</Trans>
      </Text>

      <View style={[a.align_center]}>
        <ReactCrop
          aspect={aspect}
          crop={crop}
          onChange={setCrop}
          className="ReactCrop--no-animate">
          <img src={source.path} style={{maxHeight: `50vh`}} />
        </ReactCrop>
      </View>

      <View style={[a.mt_md, a.gap_md]}>
        <View style={[a.flex_row]}>
          <ToolbarButton
            label={_(msg`Original`)}
            onPress={() => changeAspect(sourceAspect)}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 5H21V19H3V5Z"
                stroke={
                  aspect === sourceAspect
                    ? t.palette.primary_600
                    : t.palette.white
                }
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
          </ToolbarButton>

          <ToolbarButton
            label={_(msg`Wide`)}
            onPress={() => changeAspect(16 / 9)}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M1 7H23V17H1V7Z"
                stroke={
                  aspect === 16 / 9 ? t.palette.primary_600 : t.palette.white
                }
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
          </ToolbarButton>

          <ToolbarButton
            label={_(msg`Square`)}
            onPress={() => changeAspect(1 / 1)}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 4H20V20H4V4Z"
                stroke={
                  aspect === 1 / 1 ? t.palette.primary_600 : t.palette.white
                }
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
          </ToolbarButton>
        </View>

        <Button
          disabled={!isNew}
          label={_(msg`Save`)}
          size="medium"
          color="primary"
          variant="solid"
          onPress={onPressSubmit}>
          <ButtonText>
            <Trans>Save</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.Inner>
  )
}

const ToolbarButton = ({
  children,
  label,
  onPress,
}: {
  children: React.ReactElement
  label: string
  onPress?: () => void
}) => {
  return (
    <Button
      onPress={onPress}
      label={label}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary">
      {children}
    </Button>
  )
}
import {Path, Svg} from 'react-native-svg'

import {manipulateImage} from '#/state/gallery'
