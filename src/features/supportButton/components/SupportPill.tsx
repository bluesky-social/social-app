import {type StyleProp, type ViewStyle} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight} from '#/components/icons/Arrow'
import {useSupportPalette} from '../palette'
import {getSupportProvider} from '../providers'
import {providerIcon} from './ProviderLogo'

/**
 * The visual Support button: locked verb, locked color, one icon. Every
 * surface renders this exact pill so people learn what green means. Behavior
 * (the interstitial, the owner's manage sheet) is layered on by the caller.
 */
export function SupportPill({
  uri,
  onPress,
  label,
  showProvider = false,
  arrow = false,
  size = 'large',
  fullWidth = false,
  disabled = false,
  style,
}: {
  /** Destination; a recognized provider's logo replaces the heart. */
  uri?: string
  onPress?: () => void
  /** Accessibility label. Defaults to the visible verb. */
  label?: string
  /** Read "Support on Ko-fi" instead of just "Support". */
  showProvider?: boolean
  /** Trailing outbound arrow, for places that read as a link card. */
  arrow?: boolean
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const palette = useSupportPalette()
  const provider = uri ? getSupportProvider(uri) : null
  const Icon = providerIcon(provider)
  // unknown destinations just say "Support" - no domain in the label
  const providerName = provider?.name ?? null

  return (
    <Button
      testID="supportButton"
      label={label ?? l`Support`}
      size={size}
      color="primary"
      onPress={onPress}
      disabled={disabled}
      style={[
        fullWidth && a.w_full,
        {backgroundColor: palette.bg},
        disabled && {opacity: 0.6},
        style,
      ]}
      hoverStyle={{backgroundColor: palette.bgHover}}>
      <ButtonIcon icon={Icon} />
      <ButtonText numberOfLines={1}>
        {showProvider && providerName ? (
          <Trans context="Creator support button, e.g. Support on Ko-fi">
            Support on {providerName}
          </Trans>
        ) : (
          <Trans context="Verb on the creator support button">Support</Trans>
        )}
      </ButtonText>
      {arrow ? <ButtonIcon icon={ArrowTopRight} /> : null}
    </Button>
  )
}
