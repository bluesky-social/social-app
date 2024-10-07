import * as React from 'react'
import {
  Dimensions,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {BottomSheetState, BottomSheetViewProps} from './BottomSheet.types'

const screenHeight = Dimensions.get('screen').height

const NativeView: React.ComponentType<
  BottomSheetViewProps & {
    ref: React.RefObject<any>
    style: StyleProp<ViewStyle>
  }
> = requireNativeViewManager('BottomSheet')

const NativeModule = requireNativeModule('BottomSheet')

export class BottomSheet extends React.Component<
  BottomSheetViewProps,
  {
    open: boolean
  }
> {
  ref = React.createRef<any>()

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
    const {children, backgroundColor, ...rest} = this.props
    const cornerRadius = rest.cornerRadius ?? 0

    if (!this.state.open) {
      return null
    }

    return (
      <NativeView
        {...rest}
        onStateChange={this.onStateChange}
        ref={this.ref}
        style={{
          position: 'absolute',
          height: screenHeight,
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
          ]}>
          <View onLayout={this.updateLayout}>{children}</View>
        </View>
      </NativeView>
    )
  }
}
