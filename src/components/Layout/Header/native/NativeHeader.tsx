import {useLayoutEffect} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {type ParamListBase, useNavigation} from '@react-navigation/native'
import {
  type NativeStackHeaderItem,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack'

import {atoms as a} from '#/alf'
import {
  useHeaderBack,
  useHeaderOpenDrawer,
} from '#/components/Layout/Header/actions'
import {
  createPressEvent,
  nativeAccessibilityLabel,
  toNativeHeader,
} from '#/components/Layout/Header/native/toNativeHeader'

/**
 * Renders nothing. Reads the `Layout.Header.Outer` children it's given and
 * sets them as the screen's native header options.
 */
export function NativeHeader({children}: {children: React.ReactNode}) {
  const {t: l, i18n} = useLingui()
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>()
  const spec = toNativeHeader(children, i18n)
  const goBack = useHeaderBack(spec.back?.onPress)
  const openDrawer = useHeaderOpenDrawer()

  useLayoutEffect(() => {
    const leftItems: NativeStackHeaderItem[] = []
    /*
     * The native back button can't run our `onPress` or go home when there's
     * nothing to go back to, so swap in a look-alike bar button for those.
     */
    const replaceBack =
      !!spec.back && (!!spec.back.onPress || !navigation.canGoBack())
    if (spec.menu) {
      leftItems.push({
        type: 'button',
        label: l`Open drawer menu`,
        ...nativeAccessibilityLabel(l`Open drawer menu`),
        icon: {type: 'sfSymbol', name: 'line.3.horizontal'},
        onPress: openDrawer,
      })
    }
    if (replaceBack) {
      leftItems.push({
        type: 'button',
        label: l`Go back`,
        ...nativeAccessibilityLabel(l`Go back`),
        icon: {type: 'sfSymbol', name: 'chevron.backward'},
        onPress: () => goBack(createPressEvent()),
      })
    }
    leftItems.push(...spec.leftItems)

    const {customTitle} = spec
    navigation.setOptions({
      headerTitle: customTitle
        ? () => <View style={[a.align_center]}>{customTitle}</View>
        : spec.title,
      // Our headers only show a back button when they ask for one.
      headerBackVisible: !!spec.back && !replaceBack,
      unstable_headerLeftItems: leftItems.length ? () => leftItems : undefined,
      unstable_headerRightItems: spec.rightItems.length
        ? () => spec.rightItems
        : undefined,
    })
  })

  return null
}
