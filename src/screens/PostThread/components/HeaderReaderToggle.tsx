import {useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {Button, ButtonIcon} from '#/components/Button'
import {PageText_Stroke2_Corner0_Rounded as PageText} from '#/components/icons/PageText'

/**
 * Quick toggle for the thread reader view, shown when the thread contains an
 * OP self-thread chain.
 */
export function HeaderReaderToggle({
  active,
  onPress,
}: {
  active: boolean
  onPress: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Button
      label={active ? l`Exit reader view` : l`Read as one post`}
      size="small"
      variant="ghost"
      color={active ? 'primary' : 'secondary'}
      shape="round"
      hitSlop={HITSLOP_10}
      onPress={onPress}>
      <ButtonIcon icon={PageText} size="md" />
    </Button>
  )
}
