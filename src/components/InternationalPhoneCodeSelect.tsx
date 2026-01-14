import {Fragment, useMemo} from 'react'
import {Text as RNText} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type CountryCode,
  getDefaultCountry,
  INTERNATIONAL_TELEPHONE_CODES,
} from '#/lib/international-telephone-codes'
import {regionName} from '#/locale/helpers'
import {isWeb} from '#/platform/detection'
import {atoms as a, web} from '#/alf'
import * as Select from '#/components/Select'
import {useGeolocation} from '#/geolocation'

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
  value?: CountryCode
  onChange: (value: CountryCode) => void
}) {
  const {_, i18n} = useLingui()
  const location = useGeolocation()

  const defaultCountry = useMemo(() => {
    return getDefaultCountry(location)
  }, [location])

  const items = useMemo(() => {
    return (
      Object.entries(INTERNATIONAL_TELEPHONE_CODES)
        .map(([value, {code, unicodeFlag, svgFlag}]) => {
          const name = regionName(value, i18n.locale)

          return {
            value,
            name,
            code,
            label: `${name} ${code}`,
            unicodeFlag,
            svgFlag,
          }
        })
        // boost the default value to the top, then sort by name
        .sort((a, b) => {
          if (a.value === defaultCountry) return -1
          if (b.value === defaultCountry) return 1
          return a.name.localeCompare(b.name)
        })
    )
  }, [i18n.locale, defaultCountry])

  const selected = useMemo(() => {
    return items.find(item => item.value === value)
  }, [value, items])

  return (
    <Select.Root value={value} onValueChange={onChange as (v: string) => void}>
      <Select.Trigger label={_(msg`Select telephone code`)}>
        <Select.ValueText placeholder="+..." webOverrideValue={selected}>
          {selected => (
            <>
              <Flag {...selected} />
              {selected.code}
            </>
          )}
        </Select.ValueText>
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        label={_(msg`Country code`)}
        items={items}
        renderItem={item => (
          <Fragment key={item.value}>
            <Select.Item value={item.value} label={item.label}>
              <Select.ItemIndicator />
              <Select.ItemText style={[a.flex_1]} emoji>
                {isWeb ? <Flag {...item} /> : item.unicodeFlag + ' '}
                {item.name}
              </Select.ItemText>
              <Select.ItemText style={[a.text_right]}>
                {' '}
                {item.code}
              </Select.ItemText>
            </Select.Item>
            {item.value === defaultCountry && <Select.Separator />}
          </Fragment>
        )}
      />
    </Select.Root>
  )
}

function Flag({unicodeFlag, svgFlag}: {unicodeFlag: string; svgFlag: any}) {
  if (isWeb) {
    return (
      <Image
        source={svgFlag}
        style={[
          a.rounded_2xs,
          {height: 13, aspectRatio: 4 / 3, marginRight: 6},
          web({verticalAlign: 'bottom'}),
        ]}
        accessibilityIgnoresInvertColors
      />
    )
  }
  return <RNText style={[{lineHeight: 21}]}>{unicodeFlag + ' '}</RNText>
}
