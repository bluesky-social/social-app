import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {type AtmosphereAppCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {AppCard} from './AppCard'

export function FeaturedApps({apps}: {apps: AtmosphereAppCardData[]}) {
  if (!apps.length) return null

  return (
    <View style={[a.gap_md]}>
      <Text accessibilityRole="header" style={[a.text_lg, a.font_semi_bold]}>
        <Trans>Apps on the Atmosphere</Trans>
      </Text>
      <View style={[a.gap_md]}>
        {apps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
      </View>
    </View>
  )
}
