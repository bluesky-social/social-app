import {type StyleProp, type ViewStyle} from 'react-native'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useChatInvite} from './Context'

/**
 * The join/open action button for a chat invite. Reads the derived action from
 * `ChatInvite.Root` context. Pass `onPress` to intercept (e.g. to close a
 * surface before navigating); it runs before the default action. Renders
 * nothing while loading or when there's no preview to act on.
 */
export function JoinButton({
  onPress,
  style,
}: {
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {action, hasFixedHeight} = useChatInvite()

  if (!action) return null

  return (
    <Button
      testID="joinButton"
      onPress={() => {
        onPress?.()
        action.onPress()
      }}
      label={action.label}
      accessibilityHint={action.accessibilityHint}
      size="medium"
      color={action.color}
      disabled={action.disabled}
      style={[a.w_full, style]}>
      {action.side === 'left' && <ButtonIcon icon={action.icon} />}
      <ButtonText allowFontScaling={!hasFixedHeight}>{action.label}</ButtonText>
      {action.side === 'right' && <ButtonIcon icon={action.icon} />}
    </Button>
  )
}
