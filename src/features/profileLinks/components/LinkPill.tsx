import {type AccessibilityActionEvent} from 'react-native'
import {getBlobCidString} from '@atproto/lex'
import {Trans, useLingui} from '@lingui/react/macro'

import {useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {useSupportPalette} from '../palette'
import {
  PILL_LEFT,
  PILL_RIGHT_ARROW,
  PILL_RIGHT_GRIP,
  PILL_RIGHT_TEXT,
  PILL_VERTICAL,
} from '../pillSize'
import {getLinkHost, getSupportProvider} from '../providers'
import {type ProfileLink} from '../types'
import {DragHandle} from './DragHandle'
import {ButtonFavicon} from './LinkFavicon'
import {linkIcon} from './ProviderLogo'

export type PillA11yActions = {
  accessibilityActions?: {name: string; label: string}[]
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
}

/** The owner's title, or the bare domain. */
export function linkLabel(link: ProfileLink): string {
  return link.title || getLinkHost(link.url)
}

/**
 * The pill for a profile link: green with the provider's logo for a
 * recognized support platform, gray with a globe for any other site. Purely
 * visual; the caller decides what a tap does.
 */
export function ProfileLinkPill({
  link,
  onPress,
  onLongPress,
  label,
  hint,
  arrow = false,
  handle = false,
  testID = 'profileLinkPill',
  a11yActions,
  did,
}: {
  link: ProfileLink
  /** The profile owner, whose repo holds the link's stored icon. */
  did?: string
  onPress?: () => void
  onLongPress?: () => void
  /** Accessibility label. Defaults to "Open <title>". */
  label?: string
  /** Accessibility hint, e.g. where the link goes. */
  hint?: string
  /** Trailing outbound arrow, for pills that open the link. */
  arrow?: boolean
  /** Show the editor's drag grip in place of the arrow. */
  handle?: boolean
  testID?: string
  a11yActions?: PillA11yActions
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const palette = useSupportPalette()
  const provider = getSupportProvider(link.url)
  const color = provider ? palette.fg : t.atoms.text.color

  const trailing = handle ? (
    <DragHandle onGreen={!!provider} />
  ) : arrow ? (
    <ArrowTopRightIcon width={12} style={{color, marginLeft: -4}} />
  ) : null

  return (
    <Button
      testID={testID}
      label={label ?? l`Open ${linkLabel(link)}`}
      size="small"
      color={provider ? 'primary' : 'secondary'}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityHint={hint}
      {...a11yActions}
      style={[
        {
          paddingVertical: PILL_VERTICAL,
          paddingLeft: PILL_LEFT,
          paddingRight: handle
            ? PILL_RIGHT_GRIP
            : arrow
              ? PILL_RIGHT_ARROW
              : PILL_RIGHT_TEXT,
        },
        provider && {backgroundColor: palette.bg},
      ]}
      hoverStyle={provider ? {backgroundColor: palette.bgHover} : undefined}>
      {!provider && link.icon && did ? (
        <ButtonFavicon
          key={getBlobCidString(link.icon)}
          did={did}
          icon={link.icon}
        />
      ) : (
        <ButtonIcon icon={linkIcon(provider)} />
      )}
      <ButtonText numberOfLines={1} emoji style={{color}}>
        {link.title ? (
          link.title
        ) : provider ? (
          <Trans context="Creator support button, e.g. Support on Ko-fi">
            Support on {provider.name}
          </Trans>
        ) : (
          getLinkHost(link.url)
        )}
      </ButtonText>
      {trailing}
    </Button>
  )
}
