import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import * as Select from '#/components/Select'

export function LanguageSelect({
  value,
  onChange,
  items = APP_LANGUAGES.map(l => ({
    label: l.name,
    value: l.code2,
  })),
  label,
  disabledBlueskySupportedLanguageSanitization = false,
}: {
  value?: string
  onChange: (value: string) => void
  items?: {label: string; value: string}[]
  label?: string
  disabledBlueskySupportedLanguageSanitization?: boolean
}) {
  const {_} = useLingui()
  const selectValue =
    value && !disabledBlueskySupportedLanguageSanitization
      ? sanitizeAppLanguageSetting(value)
      : value

  const handleOnChange = (value: string) => {
    if (!value) return
    onChange(
      disabledBlueskySupportedLanguageSanitization
        ? value
        : sanitizeAppLanguageSetting(value),
    )
  }

  return (
    <Select.Root value={selectValue} onValueChange={handleOnChange}>
      <Select.Trigger label={_(msg`Select language`)}>
        <Select.ValueText placeholder={_(msg`Select language`)} />
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        label={label}
        renderItem={({label, value}) => (
          <Select.Item value={value} label={label}>
            <Select.ItemIndicator />
            <Select.ItemText>{label}</Select.ItemText>
          </Select.Item>
        )}
        items={items}
      />
    </Select.Root>
  )
}
