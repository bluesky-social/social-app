import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useAtmosphereAppCategories} from './appCategories'

/** The app's category, like “Blogging”, as a small tag. Hidden if unknown. */
export function AppCategoryTag({category}: {category?: string}) {
  const t = useTheme()
  const categories = useAtmosphereAppCategories()
  const label = categories.find(c => c.key === category)?.label
  if (!label) return null

  return (
    <View
      style={[
        a.px_sm,
        a.py_2xs,
        a.rounded_sm,
        {backgroundColor: t.palette.primary_50},
      ]}>
      <Text style={[a.text_sm, {color: t.palette.primary_600}]}>{label}</Text>
    </View>
  )
}
