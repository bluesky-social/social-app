import React from 'react'
import {StyleSheet, View} from 'react-native'
import {RichText as RichTextAPI} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {HandIcon} from '#/lib/icons'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {Text} from '../util/text/Text'
import {RichText} from '../util/text/RichText'
import {usePalette} from 'lib/hooks/usePalette'
import {s, colors} from 'lib/styles'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

const richtext = new RichTextAPI({
  text: "Bluesky's official moderation service",
})

export function ProfileHeaderModCard() {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()

  return (
    <View
      style={[
        pal.view,
        pal.borderDark,
        s.mt5,
        {
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
        },
      ]}>
      <View style={[s.flexRow, s.alignCenter, {gap: 8}]}>
        {!isMobile && <HandIcon style={pal.text} size={24} strokeWidth={5.5} />}
        <View style={{flex: 1}}>
          <Text type="lg-bold" style={pal.text}>
            <Trans>Moderation service</Trans>
          </Text>
          <RichText richText={richtext} />
        </View>
        {isMobile ? (
          <HandIcon style={pal.text} size={24} strokeWidth={5.5} />
        ) : (
          <View
            style={[
              pal.viewLight,
              {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24},
            ]}>
            <Text type="button" style={pal.text}>
              <Trans>View</Trans>
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({})
