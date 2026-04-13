import {
  cloneElement,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  isValidElement,
} from 'react'
import {FlatList, Pressable, useWindowDimensions, View} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {type AnimatedRef, useAnimatedRef} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {Trans, useLingui} from '@lingui/react/macro'

import {mergeRefs} from '#/lib/merge-refs'
import {type Dimensions} from '#/lib/media/types'
import {useA11y} from '#/state/a11y'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'

const CONTAINER_ASPECT_RATIO = 3 / 2
const ITEM_GAP = 8 // tokens.space.sm
const MIN_PEEK = 40

interface GalleryProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onPressIn?: (index: number) => void
  viewContext?: PostEmbedViewContext
}

const Context = createContext<{
  ref: React.RefObject<View | null>
}>({
  ref: {current: null},
})

export function GalleryBleed({children}: {children: React.ReactNode}) {
  const ref = useRef<View>(null)

  if (!isValidElement(children)) {
    throw new Error('GalleryBleed children must be a single React element')
  }

  const node = children as React.ReactElement<any>

  return (
    <Context.Provider value={{ref}}>
      {cloneElement(node, {
        ref: mergeRefs([ref, node?.props?.ref]),
      })}
    </Context.Provider>
  )
}

export function useGalleryBleedRef() {
  const {ref} = useContext(Context)
  // TODO throw?
  return ref
}

export function Gallery({
  images,
  onPress,
  onPressIn,
  viewContext,
}: GalleryProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {screenReaderEnabled} = useA11y()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const bps = useBreakpoints()
  const window = useWindowDimensions()
  const contentHeight = useMemo(() => {
    if (bps.gtMobile) {
      return 300
    } else if (bps.gtPhone) {
      return 260
    } else {
      return 200
    }
  }, [bps])

  /*
   * Container overflow styles
   */
  const bleedRef = useGalleryBleedRef()
  const [bleedDims, setBleedDims] = useState<{
    left: number
    right: number
    width: number
  }>()
  const measureBleed = () => {
    bleedRef?.current?.measureInWindow((x, _y, width) => {
      setBleedDims({left: x, right: x + width, width})
    })
  }
  const contentRef = useRef<View>(null)
  const [contentDims, setContentDims] = useState<{
    left: number
    right: number
    width: number
  }>()
  const measureContent = () => {
    contentRef?.current?.measureInWindow((x, _y, width) => {
      setContentDims({left: x, right: x + width, width})
    })
  }
  const insetLeft =
    bleedDims && contentDims
      ? Math.max(0, contentDims.left - bleedDims.left)
      : 999
  const insetRight =
    bleedDims && contentDims
      ? Math.max(0, bleedDims.right - contentDims.right)
      : 999
  const width = bleedDims ? bleedDims.width : Math.min(600, window.width)
  /* End container overflow styles */

  return (
    <View
      ref={contentRef}
      style={[
        a.w_full,
        {
          height: contentHeight,
          overflow: 'visible',
        },
      ]}
      onLayout={() => {
        measureBleed()
        measureContent()
      }}>
      <BlockDrawerGesture>
        <FlatList
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate={0.993}
          directionalLockEnabled
          nestedScrollEnabled
          alwaysBounceVertical={false}
          scrollEventThrottle={16}
          data={images}
          keyExtractor={(item) => item.thumb}
          renderItem={({item}) => {
            return <GalleryImage image={item} contentHeight={contentHeight} />
          }}
          style={[{
            height: contentHeight,
            marginLeft: -insetLeft,
            width,
          }, a.debug]}
          contentContainerStyle={{
            gap: ITEM_GAP,
            paddingLeft: insetLeft,
            paddingRight: insetRight,
          }}
        />
      </BlockDrawerGesture>
    </View>
  )
}

function getAspectRatio({
  width,
  height,
}: {width?: number; height?: number} = {}) {
  if (width && width > 0 && height && height > 0) {
    return width / height
  }
  return undefined
}

function computeDims({
  height,
  aspectRatio,
}: {
  height: number
  aspectRatio?: number
}) {
  /*
   * Old images, or images from other clients can sometimes not have
   * aspectRatio populated. In these cases, default to square and we'll
   * resize once the image loads.
   */
  const width = Math.floor(height * (aspectRatio ?? 1))
  return {width, height, aspectRatio}
}

function GalleryImage({
  contentHeight: height,
  image,
}: {
  contentHeight: number
  image: AppBskyEmbedImages.ViewImage
}) {
  const t = useTheme()
  const [aspectRatio, setAspectRatio] = useState(() =>
    getAspectRatio(image.aspectRatio),
  )
  const dims = computeDims({height, aspectRatio})

  return (
    <Pressable style={[a.rounded_md, a.overflow_hidden, t.atoms.bg_contrast_25]}>
      <Image
        source={{uri: image.thumb}}
        contentFit="cover"
        accessible={true}
        accessibilityLabel={image.alt}
        accessibilityHint=""
        accessibilityIgnoresInvertColors
        loading="eager"
        // loading={index === 0 ? 'eager' : 'lazy'}
        style={[dims]}
        onLoad={e => {
          const ar = getAspectRatio(e.source)
          if (ar && ar !== aspectRatio) {
            setAspectRatio(ar)
          }
        }}
      />
    </Pressable>
  )
}
