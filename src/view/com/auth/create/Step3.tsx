import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {CreateAccountModel} from 'state/models/ui/create-account'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {s} from 'lib/styles'
import {TextInput} from '../util/TextInput'
import {createFullHandle} from 'lib/strings/handles'
import {usePalette} from 'lib/hooks/usePalette'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/** STEP 3: Your user handle
 * @field User handle
 */
export const Step3 = observer(function Step3Impl({
  model,
}: {
  model: CreateAccountModel
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  return (
    <View>
      <StepHeader step="3" title={_(msg`Your user handle`)} />
      <View style={s.pb10}>
        <TextInput
          testID="handleInput"
          icon="at"
          placeholder="e.g. alice"
          value={model.handle}
          editable
          onChange={model.setHandle}
          // TODO: Add explicit text label
          accessibilityLabel={_(msg`User handle`)}
          accessibilityHint="Input your user handle"
        />
        <Text type="lg" style={[pal.text, s.pl5, s.pt10]}>
          <Trans>Your full handle will be</Trans>
          <Text type="lg-bold" style={[pal.text, s.ml5]}>
            @{createFullHandle(model.handle, model.userDomain)}
          </Text>
        </Text>
      </View>
      {model.error ? (
        <ErrorMessage message={model.error} style={styles.error} />
      ) : undefined}
    </View>
  )
})

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
  },
})
