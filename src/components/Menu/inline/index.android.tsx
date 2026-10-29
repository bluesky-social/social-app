import {useImperativeHandle, useState} from 'react'
import {nativeNanoSymbol} from 'react-native-nano-icons/symbols'
import {
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  Icon,
  RNHostView,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose'
import {
  padding,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers'

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
 * A group of items, with an optional heading. Material menus have no
 * sections, so sections are separated by dividers.
 */
export function InlineSection({title, divider, children}: InlineSectionProps) {
  const colors = useMaterialColors()
  return (
    <>
      {divider && <HorizontalDivider />}
      {title && (
        <Text
          color={colors.onSurfaceVariant}
          style={{typography: 'labelMedium'}}
          modifiers={[padding(12, 8, 12, 8)]}>
          {title}
        </Text>
      )}
      {children}
    </>
  )
}

/**
 * A menu row. Radio items show a trailing checkmark when selected.
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
      modifiers={testID ? [testIDModifier(testID)] : undefined}
      onClick={() => {
        control.close()
        onPress()
      }}>
      <DropdownMenuItem.Text>
        <Text>{title}</Text>
      </DropdownMenuItem.Text>
      {icon && (
        <DropdownMenuItem.LeadingIcon>
          <Icon source={icon} size={24} />
        </DropdownMenuItem.LeadingIcon>
      )}
      {selected && CHECK && (
        <DropdownMenuItem.TrailingIcon>
          <Icon source={CHECK} size={24} />
        </DropdownMenuItem.TrailingIcon>
      )}
    </DropdownMenuItem>
  )
}
