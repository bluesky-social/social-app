import 'react-image-crop/dist/ReactCrop.css'

import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import ReactCrop, {PercentCrop} from 'react-image-crop'

import {manipulateImage} from '#/state/gallery'
import {atoms as a} from '#/alf'
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

  const source = image.source
  const manips = image.manips

  const {initialCrop} = React.useMemo(() => {
    const initialArea = manips?.crop

    let crop: PercentCrop | undefined

    if (initialArea) {
      crop = {
        unit: '%',
        x: (initialArea.originX / source.width) * 100,
        y: (initialArea.originY / source.height) * 100,
        width: (initialArea.width / source.width) * 100,
        height: (initialArea.height / source.height) * 100,
      }
    }

    return {
      initialCrop: crop,
    }
  }, [source, manips])

  const [crop, setCrop] = React.useState(initialCrop)

  const isEmpty = !crop || (crop.width || crop.height) === 0
  const isNew = initialCrop ? true : !isEmpty

  const onPressSubmit = React.useCallback(async () => {
    const result = await manipulateImage(image, {
      crop: !isEmpty
        ? {
            originX: (crop.x * source.width) / 100,
            originY: (crop.y * source.height) / 100,
            width: (crop.width * source.width) / 100,
            height: (crop.height * source.height) / 100,
          }
        : undefined,
    })

    onChange(result)
    control.close()
  }, [crop, isEmpty, image, source, control, onChange])

  return (
    <Dialog.Inner label={_(msg`Edit image`)}>
      <Dialog.Close />

      <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
        <Trans>Edit image</Trans>
      </Text>

      <View style={[a.align_center]}>
        <ReactCrop
          crop={crop}
          onChange={(_, next) => setCrop(next)}
          className="ReactCrop--no-animate">
          <img src={source.path} style={{maxHeight: `50vh`}} />
        </ReactCrop>
      </View>

      <View style={[a.mt_md, a.gap_md]}>
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
