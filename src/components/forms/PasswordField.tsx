import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {Eye_Stroke2_Corner0_Rounded as EyeIcon} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'

/**
 * Password input with a lock icon and a reveal/hide toggle. Callers keep
 * ownership of autocomplete, password rules, and submit behavior.
 */
export function PasswordField({
  isInvalid = false,
  value,
  autoCapitalize = 'none',
  autoCorrect = false,
  hitSlop = {...HITSLOP_20, right: 0},
  ...rest
}: Omit<TextField.InputProps, 'secureTextEntry' | 'children'>) {
  const [revealPassword, setRevealPassword] = useState(false)

  return (
    <TextField.Root isInvalid={isInvalid}>
      <TextField.Icon icon={LockIcon} />
      <TextField.Input
        {...rest}
        value={value}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        hitSlop={hitSlop}
        secureTextEntry={!revealPassword}
      />
      <RevealPasswordButton
        active={revealPassword}
        hasPassword={!!value}
        onPress={() => setRevealPassword(r => !r)}
      />
    </TextField.Root>
  )
}

function RevealPasswordButton({
  active,
  hasPassword,
  onPress,
}: {
  active: boolean
  hasPassword: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const context = TextField.useTextFieldContext()

  /*
   * The icon shows the action the button performs, not the current state: an
   * open eye when the password is hidden (tap to reveal), a crossed-out eye
   * when it is visible (tap to hide).
   */
  const Icon = active ? EyeSlashIcon : EyeIcon

  if (!hasPassword && !context.focused) return null

  return (
    <View style={[a.z_10, a.pl_sm, {marginRight: tokens.space.xs * -1}]}>
      <Button
        testID="showPasswordButton"
        onPress={onPress}
        label={active ? l`Hide password` : l`Reveal password`}
        color="secondary"
        size="small"
        shape="round"
        style={[a.bg_transparent]}
        hitSlop={tokens.space.sm}>
        <Icon
          size="md"
          style={[
            context.focused ? t.atoms.text : t.atoms.text_contrast_medium,
          ]}
        />
      </Button>
    </View>
  )
}
