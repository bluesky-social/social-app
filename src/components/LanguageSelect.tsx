import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import * as Select from '#/components/Select'

export function LanguageSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const {_} = useLingui()

  const handleOnChange = React.useCallback(
    (value: string) => {
      if (!value) return
      onChange(sanitizeAppLanguageSetting(value))
    },
    [onChange],
  )

  return (
    <Select.Root
      value={sanitizeAppLanguageSetting(value)}
      onValueChange={handleOnChange}>
      <Select.Trigger label={_(msg`Select language`)}>
        <Select.ValueText />
        <Select.Icon />
      </Select.Trigger>
      <Select.Content
        renderItem={({label, value}) => (
          <Select.Item value={value} label={label}>
            <Select.ItemIndicator />
            <Select.ItemText>{label}</Select.ItemText>
          </Select.Item>
        )}
        items={APP_LANGUAGES.map(l => ({
          label: l.name,
          value: l.code2,
        }))}
      />
    </Select.Root>
  )
}
