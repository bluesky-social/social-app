import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useSetMinimalShellMode} from '#/state/shell'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {s} from 'lib/styles'
import {TextLink} from 'view/com/util/Link'
import {Text} from 'view/com/util/text/Text'
import {ScrollView} from 'view/com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'CommunityGuidelines'
>
export const CommunityGuidelinesScreen = (_props: Props) => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Community Guidelines`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text style={pal.text}>
            <Trans>
              The Community Guidelines have been moved to{' '}
              <TextLink
                style={pal.link}
                href="https://bsky.social/about/support/community-guidelines"
                text="bsky.social/about/support/community-guidelines"
              />
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}
