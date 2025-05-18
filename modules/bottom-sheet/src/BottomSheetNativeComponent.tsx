import * as React from 'react'
import {
  Dimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {isIOS} from '#/platform/detection'
import {
  type BottomSheetState,
  type BottomSheetViewProps,
} from './BottomSheet.types'
import {BottomSheetPortalProvider} from './BottomSheetPortal'
import {Context as PortalContext} from './BottomSheetPortal'

const screenHeight = Dimensions.get('screen').height

const NativeView: React.ComponentType<
  BottomSheetViewProps & {
    ref: React.RefObject<any>
    style: StyleProp<ViewStyle>
  }
> = requireNativeViewManager('BottomSheet')

const NativeModule = requireNativeModule('BottomSheet')

const isIOS15 =
  Platform.OS === 'ios' &&
  // semvar - can be 3 segments, so can't use Number(Platform.Version)
  Number(Platform.Version.split('.').at(0)) < 16

export class BottomSheetNativeComponent extends React.Component<
  BottomSheetViewProps,
  {
    open: boolean
    viewHeight?: number
  }
> {
  ref = React.createRef<any>()

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

  private updateLayout = () => {
    this.ref.current?.updateLayout()
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

    let extraStyles
    if (isIOS15 && this.state.viewHeight) {
      const {viewHeight} = this.state
      const cornerRadius = this.props.cornerRadius ?? 0
      if (viewHeight < screenHeight / 2) {
        extraStyles = {
          height: viewHeight,
          marginTop: screenHeight / 2 - viewHeight,
          borderTopLeftRadius: cornerRadius,
          borderTopRightRadius: cornerRadius,
        }
      }
    }

    return (
      <Portal>
        <BottomSheetNativeComponentInner
          {...this.props}
          nativeViewRef={this.ref}
          onStateChange={this.onStateChange}
          extraStyles={extraStyles}
          onLayout={e => {
            const {height} = e.nativeEvent.layout
            this.setState({viewHeight: height})
            this.updateLayout()
          }}
        />
      </Portal>
    )
  }
}

function BottomSheetNativeComponentInner({
  children,
  backgroundColor,
  onLayout,
  onStateChange,
  nativeViewRef,
  extraStyles,
  ...rest
}: BottomSheetViewProps & {
  extraStyles?: StyleProp<ViewStyle>
  onStateChange: (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => void
  nativeViewRef: React.RefObject<View>
  onLayout: (event: LayoutChangeEvent) => void
}) {
  const insets = useSafeAreaInsets()
  const cornerRadius = rest.cornerRadius ?? 0

  const sheetHeight = isIOS ? screenHeight - insets.top : screenHeight

  return (
    <NativeView
      {...rest}
      onStateChange={onStateChange}
      ref={nativeViewRef}
      style={{
        position: 'absolute',
        height: sheetHeight,
        width: '100%',
      }}
      containerBackgroundColor={backgroundColor}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor,
          },
          Platform.OS === 'android' && {
            borderTopLeftRadius: cornerRadius,
            borderTopRightRadius: cornerRadius,
          },
          extraStyles,
        ]}>
        <View onLayout={onLayout}>
          <BottomSheetPortalProvider>{children}</BottomSheetPortalProvider>
        </View>
      </View>
    </NativeView>
  )
}
