import React from 'react'
import {View} from 'react-native'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {LabelGroupPref} from './LabelGroupPref'
import {Text} from '../util/text/Text'
import {usePalette} from '#/lib/hooks/usePalette'

export function ModServicePrefs({}: {}) {
  const pal = usePalette('default')
  const {data: preferences} = usePreferencesQuery()

  return (
    <View testID="modServicePrefs" style={[pal.border, {borderBottomWidth: 1}]}>
      <View style={{paddingHorizontal: 14, paddingBottom: 8}}>
        <Text type="2xl-bold">Settings</Text>
      </View>
      <LabelGroupPref
        preferences={preferences}
        labelGroup="nsfw"
        disabled={!preferences?.adultContentEnabled}
      />
      <LabelGroupPref
        preferences={preferences}
        labelGroup="nudity"
        disabled={!preferences?.adultContentEnabled}
      />
      <LabelGroupPref
        preferences={preferences}
        labelGroup="suggestive"
        disabled={!preferences?.adultContentEnabled}
      />
      <LabelGroupPref
        preferences={preferences}
        labelGroup="gore"
        disabled={!preferences?.adultContentEnabled}
      />
      <LabelGroupPref preferences={preferences} labelGroup="hate" />
      <LabelGroupPref preferences={preferences} labelGroup="spam" />
      <LabelGroupPref preferences={preferences} labelGroup="impersonation" />
    </View>
  )
}
