import 'react-image-crop/dist/ReactCrop.css'

import {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import ReactCrop, {type PercentCrop} from 'react-image-crop'

import {
  type ImageSource,
  type ImageTransformation,
  manipulateImage,
} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {type EditImageDialogProps} from './EditImageDialog'

export function EditImageDialog(props: EditImageDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      <DialogInner {...props} />
    </Dialog.Outer>
  )
}

function DialogInner({
  control,
  image,
  onChange,
  circularCrop,
  aspectRatio,
}: EditImageDialogProps) {
  const {_} = useLingui()
  const [pending, setPending] = useState(false)
  const ref = useRef<{save: () => Promise<void>}>(null)

  const cancelButton = useCallback(
    () => (
      <Button
        label={_(msg`Cancel`)}
        disabled={pending}
        onPress={() => control.close()}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="cropImageCancelBtn">
        <ButtonText style={[a.text_md]}>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    ),
    [control, _, pending],
  )

  const saveButton = useCallback(
    () => (
      <Button
        label={_(msg`Save`)}
        onPress={async () => {
          setPending(true)
          await ref.current?.save()
          setPending(false)
        }}
        disabled={pending}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        testID="cropImageSaveBtn">
        <ButtonText style={[a.text_md]}>
          <Trans>Save</Trans>
        </ButtonText>
        {pending && <ButtonIcon icon={Loader} />}
      </Button>
    ),
    [_, pending],
  )

  return (
    <Dialog.Inner
      label={_(msg`Edit image`)}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
          <Dialog.HeaderText>
            <Trans>Edit image</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      {image && (
        <EditImageInner
          saveRef={ref}
          key={image.source.id}
          image={image}
          onChange={onChange}
          circularCrop={circularCrop}
          aspectRatio={aspectRatio}
        />
      )}
    </Dialog.Inner>
  )
}

function EditImageInner({
  image,
  onChange,
  saveRef,
  circularCrop = false,
  aspectRatio,
}: Required<Pick<EditImageDialogProps, 'image'>> &
  Omit<EditImageDialogProps, 'control' | 'image'> & {
    saveRef: React.RefObject<{save: () => Promise<void>}>
  }) {
  const t = useTheme()
  const [isDragging, setIsDragging] = useState(false)
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

  const source = image.source

  const initialCrop = getInitialCrop(source, image.manips)
  const [crop, setCrop] = useState(initialCrop)

  const onPressSubmit = useCallback(async () => {
    const result = await manipulateImage(image, {
      crop:
        crop && (crop.width || crop.height) !== 0
          ? {
              originX: (crop.x * source.width) / 100,
              originY: (crop.y * source.height) / 100,
              width: (crop.width * source.width) / 100,
              height: (crop.height * source.height) / 100,
            }
          : undefined,
    })

    control.close(() => {
      onChange(result)
    })
  }, [crop, image, source, control, onChange])

  useImperativeHandle(
    saveRef,
    () => ({
      save: onPressSubmit,
    }),
    [onPressSubmit],
  )

  return (
    <View
      style={[
        a.mx_auto,
        a.border,
        t.atoms.border_contrast_low,
        a.rounded_xs,
        a.overflow_hidden,
        a.align_center,
      ]}>
      <ReactCrop
        crop={crop}
        aspect={aspectRatio}
        circularCrop={circularCrop}
        onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
        className="ReactCrop--no-animate"
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}>
        <img src={source.path} style={{maxHeight: `50vh`}} />
      </ReactCrop>
      {/* Eat clicks when dragging, otherwise mousing up over the backdrop
        causes the dialog to close */}
      {isDragging && <View style={[a.fixed, a.inset_0]} />}
    </View>
  )
}

const getInitialCrop = (
  source: ImageSource,
  manips: ImageTransformation | undefined,
): PercentCrop | undefined => {
  const initialArea = manips?.crop

  if (initialArea) {
    return {
      unit: '%',
      x: (initialArea.originX / source.width) * 100,
      y: (initialArea.originY / source.height) * 100,
      width: (initialArea.width / source.width) * 100,
      height: (initialArea.height / source.height) * 100,
    }
  }
}
