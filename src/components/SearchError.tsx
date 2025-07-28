import {View} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {atoms as a, useBreakpoints} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {TimesLarge_Stroke2_Corner0_Rounded} from './icons/Times'

export function SearchError({
  title,
  children,
}: {
  title?: string
  children?: React.ReactNode
}) {
  const {gtMobile} = useBreakpoints()
  const pal = usePalette('default')

  return (
    <Layout.Content>
      <View
        style={[
          a.align_center,
          a.gap_4xl,
          a.px_xl,
          {
            paddingVertical: 150,
          },
        ]}>
        <TimesLarge_Stroke2_Corner0_Rounded width={32} fill={pal.colors.icon} />
        <View
          style={[
            a.align_center,
            {maxWidth: gtMobile ? 394 : 294},
            gtMobile ? a.gap_md : a.gap_sm,
          ]}>
          <Text style={[a.font_bold, a.text_lg, a.text_center, a.leading_snug]}>
            {title}
          </Text>
          {children}
        </View>
      </View>
    </Layout.Content>
  )
}
