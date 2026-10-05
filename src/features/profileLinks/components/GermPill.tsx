import {Trans, useLingui} from '@lingui/react/macro'

import {useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {GermLogo} from '#/components/GermLogo'
import {
  PILL_LEFT,
  PILL_RIGHT_GRIP,
  PILL_RIGHT_TEXT,
  PILL_VERTICAL,
} from '../pillSize'

/**
 * A look-alike of the owner's Germ DM button with no behavior, used as the
 * drag ghost. The real button carries its own dialog, which shouldn't be
 * mounted twice.
 */
export function GermPill({trailing}: {trailing?: React.ReactElement}) {
  const {t: l} = useLingui()
  const t = useTheme()
  return (
    <Button
      label={l`Germ DM`}
      size="small"
      color="secondary"
      style={{
        paddingVertical: PILL_VERTICAL,
        paddingLeft: PILL_LEFT,
        paddingRight: trailing ? PILL_RIGHT_GRIP : PILL_RIGHT_TEXT,
      }}>
      <GermLogo size="small" />
      <ButtonText style={t.atoms.text}>
        <Trans>Germ DM</Trans>
      </ButtonText>
      {trailing}
    </Button>
  )
}
