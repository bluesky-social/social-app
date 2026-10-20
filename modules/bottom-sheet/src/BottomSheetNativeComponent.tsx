import {Component, createRef} from 'react'
import {
  type NativeSyntheticEvent,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {IS_IPAD} from '#/env'
import {
  type BottomSheetPresentationSizeChangeEvent,
  type BottomSheetState,
  type BottomSheetViewProps,
} from './BottomSheet.types'
import {
  BottomSheetPortalProvider,
  Context as PortalContext,
} from './BottomSheetPortal'

const NativeView: React.ComponentType<
  BottomSheetViewProps & {
    ref: React.RefObject<any>
    style: StyleProp<ViewStyle>
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

  static contextType = PortalContext

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
    const Portal = this.context as React.ContextType<typeof PortalContext>
    if (!Portal) {
      throw new Error(
        'BottomSheet: You need to wrap your component tree with a <BottomSheetPortalProvider> to use the bottom sheet.',
      )
    }

    if (!this.state.open) {
      return null
    }

    return (
      <Portal>
        <BottomSheetNativeComponentInner
          {...this.props}
          nativeViewRef={this.ref}
          onStateChange={this.onStateChange}
          onPresentationSizeChange={this.onPresentationSizeChange}
          presentationSize={this.state.presentationSize}
        />
      </Portal>
    )
  }
}

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
       */
      style={{position: 'absolute'}}
      containerBackgroundColor={nativeContainerBackgroundColor}>
      <View
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
          <BottomSheetPortalProvider>{children}</BottomSheetPortalProvider>
        </View>
      </View>
    </NativeView>
  )
}
