import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {APP_LANGUAGES} from '#/locale/languages'
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
import {resetPostsFeedQueries} from '#/state/queries/post-feed'
import {atoms as a, platform, useTheme} from '#/alf'
import * as Select from '#/components/Select'
import {Button} from './Button'

export function AppLanguageDropdown() {
  const t = useTheme()
  const {_} = useLingui()

  const queryClient = useQueryClient()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useLanguagePrefsApi()
  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  const onChangeAppLanguage = React.useCallback(
    (value: string) => {
      if (!value) return
      if (sanitizedLang !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }

      // reset feeds to refetch content
      resetPostsFeedQueries(queryClient)
    },
    [sanitizedLang, setLangPrefs, queryClient],
  )

  return (
    <Select.Root
      value={sanitizeAppLanguageSetting(langPrefs.appLanguage)}
      onValueChange={onChangeAppLanguage}>
      <Select.Trigger label={_(msg`Change app language`)}>
        {({props}) => (
          <Button
            {...props}
            label={props.accessibilityLabel}
            size={platform({
              web: 'tiny',
              native: 'small',
            })}
            variant="ghost"
            color="secondary"
            style={[
              a.pr_xs,
              a.pl_sm,
              platform({
                web: [{alignSelf: 'flex-start'}, a.gap_sm],
                native: [a.gap_xs],
              }),
            ]}>
            <Select.ValueText
              placeholder={_(msg`Select an app language`)}
              style={[t.atoms.text_contrast_medium]}
            />
            <Select.Icon style={[t.atoms.text_contrast_medium]} />
          </Button>
        )}
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
