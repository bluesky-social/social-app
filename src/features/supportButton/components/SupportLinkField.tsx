import {useState} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLink} from '#/components/icons/ChainLink'
import {Text} from '#/components/Typography'
import {useSupportPalette} from '../palette'
import {getSupportProvider, normalizeSupportUri} from '../providers'
import {type SupportProvider} from '../types'
import {ProviderLogo} from './ProviderLogo'

export type SupportLinkValidation = {
  /** Canonical https URL, or null if the input isn't a URL. */
  normalized: string | null
  /** Set when the destination is a provider we have a logo for. */
  provider: SupportProvider | null
  isRecognized: boolean
  /** Something was typed but it doesn't parse as a URL. */
  isInvalid: boolean
  isEmpty: boolean
}

/**
 * Shared validation for anywhere a creator types their payment link. Any URL
 * is allowed; recognizing a provider only affects which logo shows.
 */
export function validateSupportUri(input: string): SupportLinkValidation {
  const trimmed = input.trim()
  const normalized = trimmed ? normalizeSupportUri(trimmed) : null
  const provider = normalized ? getSupportProvider(normalized) : null
  return {
    normalized,
    provider,
    isRecognized: !!provider,
    isInvalid: trimmed.length > 0 && !normalized,
    isEmpty: trimmed.length === 0,
  }
}

/**
 * Label + input + helper line for a payment link. Must render inside a
 * Dialog (it uses Dialog.Input so the keyboard plays nicely with the sheet).
 *
 * The "Recognized" confirmation only appears once the person has typed, so a
 * field that opens prefilled with a saved link reads as settled, not as
 * something that just passed a check. Unrecognized links get no message at
 * all - they're fine, they just use the heart.
 */
export function SupportLinkField({
  label,
  defaultValue,
  onChangeText,
  validation,
  testID,
  onSubmitEditing,
  errorText,
}: {
  label: string
  defaultValue: string
  onChangeText: (value: string) => void
  validation: SupportLinkValidation
  testID?: string
  onSubmitEditing?: () => void
  /** Shown in red under the field, e.g. when the link couldn't be reached. */
  errorText?: string
}) {
  const t = useTheme()
  const palette = useSupportPalette()
  const [touched, setTouched] = useState(false)

  return (
    <View>
      <TextField.LabelText>{label}</TextField.LabelText>
      <TextField.Root isInvalid={!!errorText}>
        <TextField.Icon icon={ChainLink} />
        <Dialog.Input
          testID={testID}
          label={label}
          placeholder="patreon.com/yourname"
          placeholderTextColor={t.palette.contrast_300}
          defaultValue={defaultValue}
          onChangeText={value => {
            setTouched(true)
            onChangeText(value)
          }}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="url"
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
        />
      </TextField.Root>
      {errorText ? (
        <Text style={[a.text_sm, a.mt_xs, {color: t.palette.negative_500}]}>
          {errorText}
        </Text>
      ) : touched && validation.isRecognized && validation.provider ? (
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.mt_xs]}>
          <ProviderLogo
            provider={validation.provider}
            size="xs"
            style={{color: palette.tintText}}
          />
          <Text style={[a.text_sm, {color: palette.tintText}]}>
            <Trans>Recognized: {validation.provider.name}</Trans>
          </Text>
        </View>
      ) : null}
    </View>
  )
}
