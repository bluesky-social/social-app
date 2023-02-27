import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import ImageEditor from 'react-avatar-editor'
import {Slider} from '@miblanchard/react-native-slider'
import LinearGradient from 'react-native-linear-gradient'
import {Text} from 'view/com/util/text/Text'
import {PickedMedia} from 'lib/media/types'
import {s, gradients} from 'lib/styles'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {SquareIcon, RectWideIcon, RectTallIcon} from 'lib/icons'

enum AspectRatio {
  Square = 'square',
  Wide = 'wide',
  Tall = 'tall',
}
interface Dim {
  width: number
  height: number
}
const DIMS: Record<string, Dim> = {
  [AspectRatio.Square]: {width: 1000, height: 1000},
  [AspectRatio.Wide]: {width: 1000, height: 750},
  [AspectRatio.Tall]: {width: 750, height: 1000},
}

export const snapPoints = ['0%']

export function Component({
  uri,
  onSelect,
}: {
  uri: string
  onSelect: (img?: PickedMedia) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const [as, setAs] = React.useState<AspectRatio>(AspectRatio.Square)
  const [scale, setScale] = React.useState<number>(1)
  const editorRef = React.useRef<ImageEditor>(null)

  const doSetAs = (v: AspectRatio) => () => setAs(v)

  const onPressCancel = () => {
    onSelect(undefined)
    store.shell.closeModal()
  }
  const onPressDone = () => {
    const canvas = editorRef.current?.getImageScaledToCanvas()
    if (canvas) {
      const dataUri = canvas.toDataURL('image/jpeg')
      onSelect({
        mediaType: 'photo',
        path: dataUri,
        mime: 'image/jpeg',
        size: Math.round((dataUri.length * 3) / 4), // very rough estimate
        width: DIMS[as].width,
        height: DIMS[as].height,
      })
    } else {
      onSelect(undefined)
    }
    store.shell.closeModal()
  }

  let cropperStyle
  if (as === AspectRatio.Square) {
    cropperStyle = styles.cropperSquare
  } else if (as === AspectRatio.Wide) {
    cropperStyle = styles.cropperWide
  } else if (as === AspectRatio.Tall) {
    cropperStyle = styles.cropperTall
  }
  return (
    <View>
      <View style={[styles.cropper, pal.borderDark, cropperStyle]}>
        <ImageEditor
          ref={editorRef}
          style={styles.imageEditor}
          image={uri}
          width={DIMS[as].width}
          height={DIMS[as].height}
          scale={scale}
          border={0}
        />
      </View>
      <View style={styles.ctrls}>
        <Slider
          value={scale}
          onValueChange={(v: number | number[]) =>
            setScale(Array.isArray(v) ? v[0] : v)
          }
          minimumValue={1}
          maximumValue={3}
          containerStyle={styles.slider}
        />
        <TouchableOpacity onPress={doSetAs(AspectRatio.Wide)}>
          <RectWideIcon
            size={24}
            style={as === AspectRatio.Wide ? s.blue3 : undefined}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={doSetAs(AspectRatio.Tall)}>
          <RectTallIcon
            size={24}
            style={as === AspectRatio.Tall ? s.blue3 : undefined}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={doSetAs(AspectRatio.Square)}>
          <SquareIcon
            size={24}
            style={as === AspectRatio.Square ? s.blue3 : undefined}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.btns}>
        <TouchableOpacity onPress={onPressCancel}>
          <Text type="xl" style={pal.link}>
            Cancel
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressDone}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text type="xl-medium" style={s.white}>
              Done
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cropper: {
    marginLeft: 'auto',
    marginRight: 'auto',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cropperSquare: {
    width: 400,
    height: 400,
  },
  cropperWide: {
    width: 400,
    height: 300,
  },
  cropperTall: {
    width: 300,
    height: 400,
  },
  imageEditor: {
    maxWidth: '100%',
  },
  ctrls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  slider: {
    flex: 1,
    marginRight: 10,
  },
  btns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
})
