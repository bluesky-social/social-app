import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DateField} from '#/components/forms/DateField'
import {toSimpleDateString} from '#/components/forms/DateField/utils'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'

/** The date picker requires a valid date, so default to today. */
export const DEFAULT_DATE = toSimpleDateString(new Date())

export function ClearableDateField({
  label,
  value,
  active,
  accessibilityHint,
  maximumDate = DEFAULT_DATE,
  minimumDate,
  onConfirm,
  onClear,
}: {
  label: string
  value: string
  active: boolean
  accessibilityHint?: string
  maximumDate?: string
  minimumDate?: string
  onConfirm: (value: string) => void
  onClear: () => void
}) {
  const {t: l} = useLingui()

  return (
    <View style={[a.w_full, a.relative]}>
      <DateField
        label={label}
        /*
         * An empty value renders the placeholder and leaves the field inactive
         * until the user confirms a date.
         */
        value={active ? value : ''}
        placeholder={l({
          message: 'Any date',
          comment: 'Placeholder text for a date picker',
        })}
        accessibilityHint={accessibilityHint}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        /*
         * onChangeDate is required, but activation is driven by onConfirm so
         * that iOS scroll ticks don't mark the field active.
         */
        onChangeDate={() => {}}
        onConfirm={onConfirm}
      />
      {active && (
        /*
         * Nudged left of the browser's native date-picker icon, which (in
         * Firefox especially) can't be hidden via CSS.
         */
        <View
          style={[
            a.absolute,
            a.justify_center,
            {top: 0, bottom: 0, right: 16},
          ]}>
          <Button
            label={l`Clear date`}
            onPress={onClear}
            size="tiny"
            color="secondary"
            shape="round">
            <ButtonIcon icon={XIcon} />
          </Button>
        </View>
      )}
    </View>
  )
}
