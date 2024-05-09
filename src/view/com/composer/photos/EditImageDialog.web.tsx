import 'react-image-crop/dist/ReactCrop.css'

import React from 'react'
import {View} from 'react-native'
import {Path, Svg} from 'react-native-svg'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import ReactCrop, {PercentCrop} from 'react-image-crop'

import {manipulateImage} from '#/state/gallery'
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
    const originalAspect = source.width / source.height

    let crop: PercentCrop | undefined
    let aspect = originalAspect

    if (initialArea) {
      crop = {
        unit: '%',
        x: (initialArea.originX / source.width) * 100,
        y: (initialArea.originY / source.height) * 100,
        width: (initialArea.width / source.width) * 100,
        height: (initialArea.height / source.height) * 100,
      }

      aspect = initialArea.aspect
    }

    return {
      initialCrop: crop,
      initialAspect: aspect,
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
            aspect: aspect,
            originX: (crop.x * source.width) / 100,
            originY: (crop.y * source.height) / 100,
            width: (crop.width * source.width) / 100,
            height: (crop.height * source.height) / 100,
          }
        : undefined,
    })

    onChange(result)
    control.close()
  }, [crop, isEmpty, aspect, image, source, control, onChange])

  const changeAspect = (next: number) => {
    if (next !== aspect) {
      setAspect(next)
      setCrop(undefined)
    }
  }

  return (
    <Dialog.Inner label={_(msg`Edit image`)}>
      <Dialog.Close />

      <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
        <Trans>Edit image</Trans>
      </Text>

      <View style={[a.align_center]}>
        <ReactCrop
          aspect={aspect}
          crop={crop}
          onChange={(_, next) => setCrop(next)}
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
