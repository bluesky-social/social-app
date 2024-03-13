import React, {useEffect} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {styles} from './styles'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export const PasswordUpdatedForm = ({
  onPressNext,
}: {
  onPressNext: () => void
}) => {
  const {screen} = useAnalytics()
  const pal = usePalette('default')
  const {_} = useLingui()

  useEffect(() => {
    screen('Signin:PasswordUpdatedForm')
  }, [screen])

  return (
    <>
      <View>
        <Text type="title-lg" style={[pal.text, styles.screenTitle]}>
          <Trans>Password updated!</Trans>
        </Text>
        <Text type="lg" style={[pal.text, styles.instructions]}>
          <Trans>You can now sign in with your new password.</Trans>
        </Text>
        <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
          <View style={s.flex1} />
          <TouchableOpacity
            onPress={onPressNext}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Close alert`)}
            accessibilityHint={_(msg`Closes password update alert`)}>
            <Text type="xl-bold" style={[pal.link, s.pr5]}>
              <Trans>Okay</Trans>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}
