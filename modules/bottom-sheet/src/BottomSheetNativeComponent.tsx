import {Component, createRef, use} from 'react'
import {
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  type StyleProp,
  unstable_TextAncestorContext as TextAncestorContext,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'
import * as VirtualizedLists from '@react-native/virtualized-lists'

import {IS_IPAD} from '#/env'
import {
  type BottomSheetPresentationSizeChangeEvent,
  type BottomSheetState,
  type BottomSheetViewProps,
} from './BottomSheet.types'

/*
 * The resetter is only reachable through the package's untyped default export,
 * which is also how RN's own Modal gets it.
 */
const {VirtualizedListContextResetter} = (
  VirtualizedLists as unknown as {
    default: {
      VirtualizedListContextResetter: React.ComponentType<{
        children: React.ReactNode
      }>
    }
  }
).default

const NativeView: React.ComponentType<
  BottomSheetViewProps & {
    ref: React.RefObject<any>
    style: StyleProp<ViewStyle>
    layoutRoot: boolean
  }
> = requireNativeViewManager('BottomSheet')

const NativeModule = requireNativeModule('BottomSheet')

export class BottomSheetNativeComponent extends Component<
  BottomSheetViewProps,
  {
    open: boolean
    presentationSize?: BottomSheetPresentationSizeChangeEvent['nativeEvent']
  }
> {
  ref = createRef<any>()

  constructor(props: BottomSheetViewProps) {
    super(props)
    this.state = {
      open: false,
      presentationSize: undefined,
    }
  }

  present() {
    this.setState({open: true, presentationSize: undefined})
  }

  dismiss() {
    this.ref.current?.dismiss()
  }

  private onStateChange = (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => {
    const {state} = event.nativeEvent
    const isOpen = state !== 'closed'
    this.setState({
      open: isOpen,
      presentationSize: isOpen ? this.state.presentationSize : undefined,
    })
    this.props.onStateChange?.(event)
  }

  private onPresentationSizeChange = (
    event: BottomSheetPresentationSizeChangeEvent,
  ) => {
    this.setState({presentationSize: event.nativeEvent})
    this.props.onPresentationSizeChange?.(event)
  }

  static dismissAll = async () => {
    await NativeModule.dismissAll()
  }

  render() {
    const {deferPresentation, ...props} = this.props
    if (!this.state.open || deferPresentation) {
      return null
    }

    return (
      <InPlaceHost>
        <BottomSheetNativeComponentInner
          {...props}
          nativeViewRef={this.ref}
          onStateChange={this.onStateChange}
          onPresentationSizeChange={this.onPresentationSizeChange}
          presentationSize={this.state.presentationSize}
        />
      </InPlaceHost>
    )
  }
}

/**
 * The native view moves its content into a natively presented controller (iOS)
 * or dialog window (Android), so it can be rendered right where the sheet is
 * declared, without a JS portal. That keeps the content in the same React
 * commit as its owner, and nested sheets present from their parent sheet
 * because their native view sits inside it.
 *
 * What stays behind in the parent is an empty native view. This host keeps it
 * out of the parent's layout and resets the list contexts that would otherwise
 * leak into the content, as RN's `Modal` does.
 */
function InPlaceHost({children}: {children: React.ReactNode}) {
  const hasTextAncestor = use(TextAncestorContext)
  const {width} = useWindowDimensions()

  const host = (
    <View
      pointerEvents="box-none"
      /*
       * The native view's `left` and `right` are its width fallback until the
       * native canvas size lands, so give them the window width rather than
       * whatever the surrounding parent happens to be.
       */
      style={{position: 'absolute', top: 0, left: 0, width, height: 0}}>
      <VirtualizedListContextResetter>
        <ScrollView.Context.Provider value={null}>
          {children}
        </ScrollView.Context.Provider>
      </VirtualizedListContextResetter>
    </View>
  )

  if (!hasTextAncestor) {
    return host
  }

  /*
   * Inside a <Text>, such as a hashtag menu, a view becomes an inline
   * attachment sized by its own layout, and position is ignored. A 0x0
   * wrapper keeps it from taking up space in the text.
   */
  return <View style={{width: 0, height: 0}}>{host}</View>
}

const claimResponder = () => true

function BottomSheetNativeComponentInner({
  children,
  backgroundColor,
  containerBackgroundColor,
  desiredContentHeight,
  maxHeight,
  onStateChange,
  onPresentationSizeChange,
  popover = 'never',
  popoverWidth,
  presentationSize,
  nativeViewRef,
  ...rest
}: BottomSheetViewProps & {
  onStateChange: (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => void
  onPresentationSizeChange: BottomSheetViewProps['onPresentationSizeChange']
  presentationSize?: BottomSheetPresentationSizeChangeEvent['nativeEvent']
  nativeViewRef: React.RefObject<View>
}) {
  const cornerRadius = rest.cornerRadius ?? 0
  const presentationHeight =
    Platform.OS === 'ios' ? presentationSize?.height : undefined
  const hasPresentedPopover = presentationSize?.isPopover === true
  const usesReportedContentHeight =
    (IS_IPAD || (Platform.OS === 'ios' && popover !== 'never')) &&
    presentationHeight != null &&
    desiredContentHeight != null
  const isHeightConstrained =
    maxHeight != null ||
    rest.fullHeight === true ||
    hasPresentedPopover ||
    usesReportedContentHeight
  const viewportMaxHeight =
    maxHeight != null
      ? presentationHeight != null
        ? Math.min(maxHeight, presentationHeight)
        : maxHeight
      : (rest.fullHeight === true || hasPresentedPopover) &&
          presentationHeight != null
        ? presentationHeight
        : undefined

  const effectiveViewportMaxHeight =
    viewportMaxHeight ??
    (usesReportedContentHeight ? presentationHeight : undefined)
  const nativeContainerBackgroundColor =
    Platform.OS === 'ios'
      ? (containerBackgroundColor ?? backgroundColor)
      : backgroundColor

  return (
    <NativeView
      {...rest}
      {...(Platform.OS === 'ios'
        ? {
            desiredContentHeight,
            popover,
            popoverWidth,
            onPresentationSizeChange,
          }
        : {})}
      maxHeight={maxHeight}
      onStateChange={onStateChange}
      ref={nativeViewRef}
      /*
       * On Android the native side owns this view's size - the canvas the sheet
       * content is laid out on - and pushes it into the Fabric shadow tree through
       * ExpoView's `setViewSize` state channel. It knows the real sheet frame
       * (window insets, Material's max-width cap on tablets, rotation), which JS
       * can only guess at. `width` and `height` must stay unset there:
       * `ExpoViewComponentDescriptor::adopt()` only applies the state size on an
       * axis where the style leaves that dimension undefined, so a style dimension
       * would silently win and clip the content again.
       *
       * iOS now uses the same native sizing path. UIKit knows the actual presented
       * controller bounds, including popover width, form-sheet width, and changes
       * after adaptation or rotation.
       *
       * `left` and `right` are a fallback for when that state size hasn't landed.
       * Without them an unsized absolute view shrinks to fit its content, which
       * squeezes `flex: 1` rows down to their icons (APP-3602). The state size
       * still wins, since a defined width takes precedence over the insets.
       */
      style={{position: 'absolute', left: 0, right: 0}}
      /*
       * The sheet dispatches its own touches, in coordinates relative to the
       * sheet. Without this, `measure()` inside it would be relative to the
       * surface root, through wherever the sheet is declared, and Pressability
       * would see any finger movement as leaving the press rect. RN's Modal
       * sets the same trait.
       */
      layoutRoot
      containerBackgroundColor={nativeContainerBackgroundColor}>
      <View
        /*
         * The content's React ancestors are wherever the sheet is declared,
         * like a post's Pressable. Claim touches nothing inside handled, so
         * they don't bubble out to them, as RN's Modal does.
         */
        onStartShouldSetResponder={claimResponder}
        style={[
          {
            flex: 1,
            backgroundColor:
              Platform.OS === 'ios' ? 'transparent' : backgroundColor,
          },
          effectiveViewportMaxHeight != null && {
            maxHeight: effectiveViewportMaxHeight,
          },
          Platform.OS === 'android' && {
            /*
             * The native canvas is sized after the first layout. Allow content
             * measured without a height constraint to shrink to that canvas.
             */
            flexShrink: 1,
            borderTopLeftRadius: cornerRadius,
            borderTopRightRadius: cornerRadius,
            overflow: 'hidden',
          },
        ]}>
        <View
          style={
            isHeightConstrained
              ? [
                  {flex: 1},
                  effectiveViewportMaxHeight != null && {
                    maxHeight: effectiveViewportMaxHeight,
                  },
                ]
              : undefined
          }>
          {children}
        </View>
      </View>
    </NativeView>
  )
}
