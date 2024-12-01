import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {resetToSystemTime, setCustomTime} from '#/lib/time/provider'
import {atoms as a} from '#/alf'
import {Button} from '../util/forms/Button'
import {DateInput} from '../util/forms/DateInput'
import {Text} from '../util/text/Text'

interface Props {
  onTimestampChange: (date: Date | null) => void
}

export function CustomTimestampPicker({onTimestampChange}: Props) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const [customDate, setCustomDate] = React.useState<Date | null>(null)

  const onDateChange = React.useCallback(
    (date: Date) => {
      setCustomDate(date)
      setCustomTime(date)
      onTimestampChange(date)
    },
    [onTimestampChange],
  )

  const onReset = React.useCallback(() => {
    setCustomDate(null)
    resetToSystemTime()
    onTimestampChange(null)
  }, [onTimestampChange])

  return (
    <View style={[styles.container]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <FontAwesomeIcon
          icon={['far', 'clock']}
          style={{color: pal.colors.textLight}}
          size={16}
        />
        <Text style={[pal.textLight]}>
          {customDate
            ? _(msg`Custom timestamp enabled`)
            : _(msg`Use custom timestamp`)}
        </Text>
      </View>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <DateInput
          testID="customTimestampPicker"
          value={customDate || new Date()}
          onChange={onDateChange}
          buttonType="default-light"
          buttonStyle={[a.rounded_sm]}
          accessibilityLabel={_(msg`Choose post timestamp`)}
          accessibilityHint={_(
            msg`Select a custom date and time for this post`,
          )}
        />
        {customDate && (
          <Button
            type="default-light"
            onPress={onReset}
            accessibilityLabel={_(msg`Reset timestamp`)}
            accessibilityHint={_(
              msg`Resets the post timestamp back to the current time`,
            )}
            style={[a.rounded_sm]}>
            <Text style={[pal.text]}>{_(msg`Reset`)}</Text>
          </Button>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
})
