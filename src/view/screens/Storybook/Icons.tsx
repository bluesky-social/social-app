import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight} from '#/components/icons/Arrow'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Loader} from '#/components/Loader'
import {H1} from '#/components/Typography'

export function Icons() {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <H1>Icons</H1>

      <View style={[a.flex_row, a.gap_xl]}>
        <Globe size="xs" fill={t.atoms.text.color} />
        <Globe size="sm" fill={t.atoms.text.color} />
        <Globe size="md" fill={t.atoms.text.color} />
        <Globe size="lg" fill={t.atoms.text.color} />
        <Globe size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <ArrowTopRight size="xs" fill={t.atoms.text.color} />
        <ArrowTopRight size="sm" fill={t.atoms.text.color} />
        <ArrowTopRight size="md" fill={t.atoms.text.color} />
        <ArrowTopRight size="lg" fill={t.atoms.text.color} />
        <ArrowTopRight size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <CalendarDays size="xs" fill={t.atoms.text.color} />
        <CalendarDays size="sm" fill={t.atoms.text.color} />
        <CalendarDays size="md" fill={t.atoms.text.color} />
        <CalendarDays size="lg" fill={t.atoms.text.color} />
        <CalendarDays size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <Loader size="xs" fill={t.atoms.text.color} />
        <Loader size="sm" fill={t.atoms.text.color} />
        <Loader size="md" fill={t.atoms.text.color} />
        <Loader size="lg" fill={t.atoms.text.color} />
        <Loader size="xl" fill={t.atoms.text.color} />
      </View>

      <View style={[a.flex_row, a.gap_xl]}>
        <Globe size="xs" gradient="sky" />
        <Globe size="sm" gradient="sky" />
        <Globe size="md" gradient="sky" />
        <Globe size="lg" gradient="sky" />
        <Globe size="xl" gradient="sky" />
      </View>
    </View>
  )
}
