import {useImperativeHandle, useState} from 'react'
import {type TextStyle} from 'react-native'
import {nativeNanoSymbol} from 'react-native-nano-icons/symbols'
import {
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  Icon,
  RNHostView,
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

/** Extra space between an item's text and its trailing icon. */
const ICON_GAP = 12

/** Our `sm` icon size, so the check sits lighter than the item icons. */
const CHECK_SIZE = 16

/** Keeps menus of short items from looking cramped. */
const MIN_WIDTH = 200

/** Space between the menu and its trigger. */
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
 * Anchors a Material `DropdownMenu` to the trigger, which opens it through
 * `control.open()` like it would open the bottom sheet.
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
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
        expressive
        anchorGap={ANCHOR_GAP}
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
  const textStyle = useComposeTextStyle([a.text_md, a.font_semi_bold])
  const icon = drawable(glyph)

  return (
    <DropdownMenuItem
      enabled={!disabled}
      elementColors={
        destructive
          ? {
              textColor: t.palette.negative_500,
              leadingIconColor: t.palette.negative_500,
            }
          : undefined
      }
      selected={selected}
      modifiers={[
        // Also sets the menu's min width, which is its widest item's.
        defaultMinSize({minWidth: MIN_WIDTH}),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}
      onClick={() => {
        control.close()
        onPress()
      }}>
      <DropdownMenuItem.Text>
        <Text style={textStyle}>{title}</Text>
      </DropdownMenuItem.Text>
      {icon && (
        <DropdownMenuItem.TrailingIcon>
          {/*
           * Keeps the longest item's text off its icon. The `size` prop would
           * apply before the padding and squeeze the glyph, so size it after.
           */}
          <Icon
            source={icon}
            modifiers={[padding(ICON_GAP, 0, 0, 0), size(ICON_SIZE, ICON_SIZE)]}
          />
        </DropdownMenuItem.TrailingIcon>
      )}
      {CHECK && (
        <DropdownMenuItem.SelectedLeadingIcon>
          <Icon source={CHECK} size={CHECK_SIZE} tint={t.palette.primary_500} />
        </DropdownMenuItem.SelectedLeadingIcon>
      )}
    </DropdownMenuItem>
  )
}
