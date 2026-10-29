import {useImperativeHandle} from 'react'
import {nativeNanoSymbol} from 'react-native-nano-icons/symbols'
import {
  Button,
  Host,
  Image,
  Label,
  Menu,
  RNHostView,
  Section,
  Toggle,
} from '@expo/ui/swift-ui'
import {
  accessibilityIdentifier,
  buttonStyle,
  disabled as disabledModifier,
  menuIndicator,
  menuStyle,
} from '@expo/ui/swift-ui/modifiers'

import {useTheme} from '#/alf'
import {
  type InlineItemProps,
  type InlineRootProps,
  type InlineSectionProps,
} from '#/components/Menu/inline/types'
import {IS_DEV} from '#/env'

/**
 * Hosts the trigger as the label of a SwiftUI `Menu`, which opens the menu
 * itself when the label is tapped.
 */
export function InlineRoot({control, trigger, children}: InlineRootProps) {
  const t = useTheme()

  useImperativeHandle(
    control.ref,
    () => ({
      open() {
        if (IS_DEV) {
          console.warn('Inline menus cannot be opened programmatically on iOS')
        }
      },
      // The menu dismisses itself when an item is selected.
      close(cb) {
        cb?.()
      },
    }),
    [],
  )

  return (
    <Host matchContents colorScheme={t.scheme} ignoreSafeArea="all">
      <Menu
        /*
         * The trigger stays the accessible element. Pressables don't handle
         * VoiceOver activation themselves, so it falls back to a synthesized
         * tap, which opens the menu like a real one.
         */
        label={<RNHostView matchContents>{trigger}</RNHostView>}
        modifiers={[
          // Keeps the trigger as-is, rather than a styled button on Catalyst.
          menuStyle('button'),
          buttonStyle('plain'),
          menuIndicator('hidden'),
        ]}>
        {children}
      </Menu>
    </Host>
  )
}

/**
 * A group of items. iOS separates sections itself, so `divider` is ignored.
 */
export function InlineSection({title, children}: InlineSectionProps) {
  return <Section title={title}>{children}</Section>
}

/**
 * A menu row. Radio items are toggles, which iOS draws with a checkmark.
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
  const symbol = glyph ? nativeNanoSymbol(glyph) : undefined
  /*
   * `systemImage` only finds Apple's symbols. Nano's symbols are custom ones
   * in the asset catalog, which need `Image(_:)`, so pass a custom label.
   */
  const customLabel =
    symbol?.type === 'sfSymbol' ? (
      <Label title={title} icon={<Image assetName={symbol.name} />} />
    ) : undefined
  const modifiers = [
    ...(disabled ? [disabledModifier(true)] : []),
    ...(testID ? [accessibilityIdentifier(testID)] : []),
  ]

  if (selected !== undefined) {
    return (
      <Toggle
        isOn={selected}
        onIsOnChange={() => onPress()}
        label={customLabel ? undefined : title}
        modifiers={modifiers}>
        {customLabel}
      </Toggle>
    )
  }

  return (
    <Button
      role={destructive ? 'destructive' : undefined}
      onPress={onPress}
      label={customLabel ? undefined : title}
      modifiers={modifiers}>
      {customLabel}
    </Button>
  )
}
