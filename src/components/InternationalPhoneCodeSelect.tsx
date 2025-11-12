import {Fragment, useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getCountriesWithTelephoneCodes} from '#/lib/international-telephone-codes'
import {useGeolocationStatus} from '#/state/geolocation'
import {atoms as a} from '#/alf'
import * as Select from '#/components/Select'

/**
 * Country picker for a phone number input
 *
 * Pro tip: you can use `location?.countryCode` from `useGeolocationStatus()`
 * to set a default value.
 */
export function InternationalPhoneCodeSelect({
  value,
  onChange,
}: {
  value?: string
  onChange: (value: string) => void
}) {
  const {_, i18n} = useLingui()
  const {location} = useGeolocationStatus()
  const items = useMemo(() => {
    const telCountryMap = getCountriesWithTelephoneCodes(i18n)

    return (
      Object.entries(telCountryMap)
        .map(([value, {name, code}]) => ({
          value,
          name,
          code,
          label: `${name} ${code}`,
        }))
        // boost the default value to the top
        .sort((a, b) =>
          a.value === location.countryCode
            ? -1
            : b.value === location.countryCode
              ? 1
              : 0,
        )
    )
  }, [i18n, location])

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger label={_(msg`Select telephone code`)}>
        <Select.ValueText placeholder={_(msg`Select telephone code`)} />
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        label={_(msg`Country code`)}
        items={items}
        renderItem={item => (
          <Fragment key={item.value}>
            <Select.Item value={item.value} label={item.label}>
              <Select.ItemIndicator />
              <Select.ItemText style={[a.flex_1]}>{item.name}</Select.ItemText>
              <Select.ItemText style={[a.text_right]}>
                {item.code}
              </Select.ItemText>
            </Select.Item>
            {item.value === location?.countryCode && <Select.Separator />}
          </Fragment>
        )}
      />
    </Select.Root>
  )
}
