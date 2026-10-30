import {useContext, useImperativeHandle, useState} from 'react'
import {type TextStyle} from 'react-native'
import {nativeNanoSymbol} from 'react-native-nano-icons/symbols'
import {
  Box,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPopup,
  HorizontalDivider,
  Host,
  Icon,
  RNHostView,
  SelectableDropdownMenuItem,
  Text,
  type TextProps,
} from '@expo/ui/jetpack-compose'
import {
  defaultMinSize,
  padding,
  size,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers'

import {atoms as a, useAlf, useTheme} from '#/alf'
import {useMaterialTheme} from '#/alf/material'
import {normalizeTextStyles} from '#/alf/typography'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {type NanoGlyphName} from '#/components/icons/glyphMaps'
import {
  InlineItemPositionContext,
  useMenuContext,
} from '#/components/Menu/context'
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

/** Extra space between an item's text and its trailing icon. */
const ICON_GAP = 12

/** Our `sm` icon size, so the check sits lighter than the item icons. */
const CHECK_SIZE = 16

/** Keeps menus of short items from looking cramped. */
const MIN_WIDTH = 200

/**
 * Space between the menu and its trigger. It pads the popup on both ends, so
 * the gap is on the trigger's side whether the menu opens below or above.
 */
const ANCHOR_GAP = 4

/**
 * The font, size and weight our `Text` would use for these styles, including
 * the user's font family and scale settings, for a Compose `Text`.
 */
function useComposeTextStyle(styles: TextStyle[]) {
  const {fonts, flags} = useAlf()
  const style = normalizeTextStyles(styles, {
    fontScale: fonts.scaleMultiplier,
    fontFamily: fonts.family,
    flags,
  })
  return {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight as NonNullable<
      TextProps['style']
    >['fontWeight'],
  }
}

/**
 * Anchors a Material 3 Expressive menu to the trigger, which opens it through
 * `control.open()` like it would open the bottom sheet. The menu is one group,
 * with its sections divided inside it.
 */
export function InlineRoot({control, trigger, children}: InlineRootProps) {
  const materialTheme = useMaterialTheme()
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
    <Host matchContents {...materialTheme}>
      <Box>
        <RNHostView matchContents>{trigger}</RNHostView>
        <DropdownMenuPopup
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
          properties={POPUP_PROPERTIES}
          modifiers={[padding(0, ANCHOR_GAP, 0, ANCHOR_GAP)]}>
          <DropdownMenuGroup>{children}</DropdownMenuGroup>
        </DropdownMenuPopup>
      </Box>
    </Host>
  )
}

/**
 * A section of the menu, divided from the one above, with an optional label.
 */
export function InlineSection({title, divider, children}: InlineSectionProps) {
  const t = useTheme()
  const labelStyle = useComposeTextStyle([a.text_sm, a.font_semi_bold])
  return (
    <>
      {/* `MenuDefaults.HorizontalDividerPadding` */}
      {divider && <HorizontalDivider modifiers={[padding(12, 2, 12, 2)]} />}
      {title && (
        <Text
          style={labelStyle}
          color={t.atoms.text_contrast_medium.color}
          modifiers={[padding(12, 8, 12, 4)]}>
          {title}
        </Text>
      )}
      {children}
    </>
  )
}

/**
 * A menu row, with its icon on the trailing side. Radio items are selectable
 * items, which show a leading check and a highlight when selected.
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
  const t = useTheme()
  const {control} = useMenuContext()
  const position = useContext(InlineItemPositionContext)
  const textStyle = useComposeTextStyle([a.text_md, a.font_medium])
  const icon = drawable(glyph)
  const destructiveColor = destructive ? t.palette.negative_500 : undefined

  const modifiers = [
    // Also sets the menu's min width, which is its widest item's.
    defaultMinSize({minWidth: MIN_WIDTH}),
    ...(testID ? [testIDModifier(testID)] : []),
  ]
  const onClick = () => {
    control.close()
    onPress()
  }
  const text = <Text style={textStyle}>{title}</Text>
  /*
   * Keeps the longest item's text off its icon. The `size` prop would apply
   * before the padding and squeeze the glyph, so size it after.
   */
  const trailingIcon = icon && (
    <Icon
      source={icon}
      modifiers={[padding(ICON_GAP, 0, 0, 0), size(ICON_SIZE, ICON_SIZE)]}
    />
  )

  if (selected !== undefined) {
    return (
      <SelectableDropdownMenuItem
        selected={selected}
        shapes={position}
        enabled={!disabled}
        colors={{
          textColor: destructiveColor,
          trailingContentColor: destructiveColor,
          selectedTextColor: destructiveColor,
          selectedTrailingContentColor: destructiveColor,
        }}
        modifiers={modifiers}
        onClick={onClick}>
        <SelectableDropdownMenuItem.Text>
          {text}
        </SelectableDropdownMenuItem.Text>
        {trailingIcon && (
          <SelectableDropdownMenuItem.TrailingContent>
            {trailingIcon}
          </SelectableDropdownMenuItem.TrailingContent>
        )}
        {CHECK && (
          <SelectableDropdownMenuItem.SelectedLeadingIcon>
            <Icon
              source={CHECK}
              size={CHECK_SIZE}
              tint={t.palette.primary_500}
            />
          </SelectableDropdownMenuItem.SelectedLeadingIcon>
        )}
      </SelectableDropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      shape={position}
      enabled={!disabled}
      elementColors={{
        textColor: destructiveColor,
        trailingIconColor: destructiveColor,
      }}
      modifiers={modifiers}
      onClick={onClick}>
      <DropdownMenuItem.Text>{text}</DropdownMenuItem.Text>
      {trailingIcon && (
        <DropdownMenuItem.TrailingIcon>
          {trailingIcon}
        </DropdownMenuItem.TrailingIcon>
      )}
    </DropdownMenuItem>
  )
}
