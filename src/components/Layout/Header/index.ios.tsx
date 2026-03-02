import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, useGutters} from '#/alf'
import {useTransparentHeaderProps} from '#/components/Layout/ScrollEdgeInteraction'
import {Outer as DefaultOuter, type OuterProps} from './index.shared'

export {
  BackButton,
  Content,
  MenuButton,
  type OuterProps,
  Slot,
  SubtitleText,
  TitleText,
} from './index.shared'

export function Outer(props: OuterProps) {
  const transparentHeaderProps = useTransparentHeaderProps()
  if (transparentHeaderProps) {
    return (
      <TransparentOuter
        transparentHeaderProps={transparentHeaderProps}
        {...props}
      />
    )
  }
  return <DefaultOuter {...props} />
}

function TransparentOuter({
  children,
  transparentHeaderProps,
}: OuterProps & {
  transparentHeaderProps: {ref: (node: View | null) => void; onLayout: any}
}) {
  const {top} = useSafeAreaInsets()
  const gutters = useGutters([0, 'base'])

  return (
    <View
      collapsable={false}
      ref={transparentHeaderProps.ref}
      onLayout={transparentHeaderProps.onLayout}
      style={[
        a.absolute,
        a.top_0,
        a.left_0,
        a.right_0,
        a.z_10,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        gutters,
        {paddingTop: top, minHeight: 48 + top},
        a.pb_xs,
      ]}>
      {children}
    </View>
  )
}
