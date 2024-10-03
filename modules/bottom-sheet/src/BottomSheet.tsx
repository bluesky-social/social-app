import * as React from 'react'
import {
  ColorValue,
  Dimensions,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {requireNativeModule} from 'expo'
import {requireNativeViewManager} from 'expo-modules-core'

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

  private getBackgroundColor = (): ColorValue | undefined => {
    const parent = React.Children.toArray(
      this.props.children,
    )[0] as React.ReactElement
    if (parent?.props?.style) {
      const parentStyle = StyleSheet.flatten(parent.props.style) as ViewStyle
      return parentStyle.backgroundColor ?? 'transparent'
    }
    return undefined
  }

  private updateLayout = () => {
    this.ref.current?.updateLayout()
  }

  static dismissAll = async () => {
    await NativeModule.dismissAll()
  }

  render() {
    const {children, ...rest} = this.props
    const topInset = rest.topInset ?? 0
    const bottomInset = rest.bottomInset ?? 0

    if (!this.state.open) {
      return null
    }

    const backgroundColor = this.getBackgroundColor()
    return (
      <NativeView
        {...rest}
        onStateChange={this.onStateChange}
        ref={this.ref}
        style={{
          position: 'absolute',
          height: screenHeight - topInset - bottomInset,
          width: '100%',
        }}
        containerBackgroundColor={backgroundColor}>
        <View
          style={{
            flex: 1,
            backgroundColor,
            paddingTop: topInset,
            paddingBottom: bottomInset,
          }}>
          <View onLayout={this.updateLayout}>{children}</View>
        </View>
      </NativeView>
    )
  }
}
