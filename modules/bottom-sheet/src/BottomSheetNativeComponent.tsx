import {Component, createRef} from 'react'
import {
  type NativeSyntheticEvent,
  Platform,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {
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
  }
> {
  ref = createRef<any>()

  static contextType = PortalContext

  constructor(props: BottomSheetViewProps) {
    super(props)
    this.state = {
      open: false,
    }
  }

  present() {
    this.setState({open: true})
  }

  dismiss() {
    this.ref.current?.dismiss()
  }

  private onStateChange = (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => {
    const {state} = event.nativeEvent
    const isOpen = state !== 'closed'
    this.setState({open: isOpen})
    this.props.onStateChange?.(event)
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
        />
      </Portal>
    )
  }
}

function BottomSheetNativeComponentInner({
  children,
  backgroundColor,
  maxHeight,
  onStateChange,
  nativeViewRef,
  ...rest
}: BottomSheetViewProps & {
  onStateChange: (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => void
  nativeViewRef: React.RefObject<View>
}) {
  const insets = useSafeAreaInsets()
  const cornerRadius = rest.cornerRadius ?? 0
  const {height: screenHeight} = useWindowDimensions()
  const isHeightConstrained = maxHeight != null || rest.fullHeight === true

  return (
    <NativeView
      {...rest}
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
       * iOS still sizes the canvas from JS. Moving it onto the same state channel
       * needs on-device iteration on iOS 26 sheet geometry (large-detent and
       * floating-card metrics), so it is deferred.
       */
      style={
        Platform.OS === 'ios'
          ? {
              position: 'absolute',
              height: screenHeight - insets.top,
              width: '100%',
            }
          : {position: 'absolute'}
      }
      containerBackgroundColor={backgroundColor}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor,
          },
          maxHeight != null && {maxHeight},
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
        <View style={isHeightConstrained ? {flex: 1} : undefined}>
          <BottomSheetPortalProvider>{children}</BottomSheetPortalProvider>
        </View>
      </View>
    </NativeView>
  )
}
