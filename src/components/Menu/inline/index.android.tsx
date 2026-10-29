import {useImperativeHandle, useState} from 'react'
import {nativeNanoSymbol} from 'react-native-nano-icons/symbols'
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  Host,
  Icon,
  RNHostView,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose'
import {testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers'

import {useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {type NanoGlyphName} from '#/components/icons/glyphMaps'
import {useMenuContext} from '#/components/Menu/context'
import {
  type InlineItemProps,
  type InlineRootProps,
  type InlineSectionProps,
} from '#/components/Menu/inline/types'

/**
 * Edge-to-edge popups that clip drop the status bar offset, so a menu near
 * the bottom of the screen detaches from its trigger.
 */
const POPUP_PROPERTIES = {clippingEnabled: false}

/**
 * The VectorDrawable that nano-icons builds for a glyph's SVG.
 */
function drawable(glyph: NanoGlyphName | undefined) {
  const symbol = glyph ? nativeNanoSymbol(glyph) : undefined
  return symbol?.type === 'image' ? symbol.source : undefined
}

const CHECK = drawable(Check.glyph)

/** `MenuDefaults.LeadingIconSize` */
const ICON_SIZE = 20

/**
 * Anchors a Material `DropdownMenu` to the trigger, which opens it through
 * `control.open()` like it would open the bottom sheet.
 */
export function InlineRoot({control, trigger, children}: InlineRootProps) {
  const t = useTheme()
  const [expanded, setExpanded] = useState(false)

  useImperativeHandle(
    control.ref,
    () => ({
      open() {
        setExpanded(true)
      },
      close(cb) {
        setExpanded(false)
        cb?.()
      },
    }),
    [],
  )

  return (
    <Host matchContents colorScheme={t.scheme}>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
        properties={POPUP_PROPERTIES}>
        <DropdownMenu.Trigger>
          <RNHostView matchContents>{trigger}</RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>{children}</DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  )
}

/**
 * A group of items, with an optional label. Groups make the menu a Material 3
 * Expressive one, with each group a separate surface.
 */
export function InlineSection({title, children}: InlineSectionProps) {
  return <DropdownMenuGroup label={title}>{children}</DropdownMenuGroup>
}

/**
 * A menu row. Radio items are selectable items, which show a leading check
 * and a highlight when selected.
 */
export function InlineItem({
  title,
  glyph,
  selected,
  destructive,
  disabled,
  testID,
  onPress,
}: InlineItemProps) {
  const {control} = useMenuContext()
  const colors = useMaterialColors()
  const icon = drawable(glyph)

  return (
    <DropdownMenuItem
      enabled={!disabled}
      elementColors={
        destructive
          ? {textColor: colors.error, leadingIconColor: colors.error}
          : undefined
      }
      selected={selected}
      modifiers={testID ? [testIDModifier(testID)] : undefined}
      onClick={() => {
        control.close()
        onPress()
      }}>
      <DropdownMenuItem.Text>
        {/* The Expressive menu's text style, which `Text` doesn't inherit */}
        <Text style={{typography: 'labelLarge'}}>{title}</Text>
      </DropdownMenuItem.Text>
      {icon && (
        <DropdownMenuItem.LeadingIcon>
          <Icon source={icon} size={ICON_SIZE} />
        </DropdownMenuItem.LeadingIcon>
      )}
      {CHECK && (
        <DropdownMenuItem.SelectedLeadingIcon>
          <Icon source={CHECK} size={ICON_SIZE} />
        </DropdownMenuItem.SelectedLeadingIcon>
      )}
    </DropdownMenuItem>
  )
}
