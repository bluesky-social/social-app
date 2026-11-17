import {createContext, use, useRef, useState} from 'react'
import {Pressable, ScrollView, View} from 'react-native'

import {List} from '#/view/com/util/List'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {H3, Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

/*
 * Test bed for rendering dialogs in place (native) and through createPortal
 * (web) instead of our state-based portals.
 */

const OwnerContext = createContext('root default (context did not flow)')

export function PortalTests() {
  return (
    <View style={[a.gap_md]}>
      <H3>Portal tests</H3>
      <NestedDialogs />
      <ControlledInputAbove />
      <DialogInListCell />
      <DarkThemeDialog />
      <InlineTextMenu />
      <GatedDialog />
      <DialogInsidePressable />
      <MeasureInSheet />
    </View>
  )
}

function OpenButton({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Button
      color="secondary"
      size="small"
      label={label}
      testID={label}
      onPress={onPress}>
      <ButtonText>{label}</ButtonText>
    </Button>
  )
}

/**
 * Dialog > dialog > menu > prompt, each declared inside the one before it.
 */
function NestedDialogs() {
  const control = Dialog.useDialogControl()
  return (
    <OwnerContext value="provided above Dialog.Outer">
      <OpenButton
        label="1. Open nested dialogs"
        onPress={() => control.open()}
      />
      <Dialog.Outer control={control} testID="level1">
        <Dialog.Handle />
        <NestedLevel1 />
      </Dialog.Outer>
    </OwnerContext>
  )
}

function NestedLevel1() {
  const owner = use(OwnerContext)
  const control = Dialog.useDialogControl()
  return (
    <Dialog.ScrollableInner label="Level 1">
      <View style={[a.gap_md]}>
        <H3>Level 1 dialog</H3>
        <Text>Owner context: {owner}</Text>
        <OpenButton label="Open level 2" onPress={() => control.open()} />
      </View>
      <Dialog.Outer control={control} testID="level2">
        <Dialog.Handle />
        <NestedLevel2 />
      </Dialog.Outer>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function NestedLevel2() {
  const owner = use(OwnerContext)
  const menuControl = Menu.useMenuControl()
  const promptControl = Prompt.usePromptControl()
  const [confirmed, setConfirmed] = useState(0)
  return (
    <Dialog.ScrollableInner label="Level 2">
      <View style={[a.gap_md]}>
        <H3>Level 2 dialog</H3>
        <Text>Owner context: {owner}</Text>
        <Text>Prompt confirmed {confirmed} times</Text>
        <Menu.Root control={menuControl}>
          <Menu.Trigger label="Open level 3 menu">
            {({props}) => (
              <Button
                {...props}
                color="secondary"
                size="small"
                label="Open level 3 menu"
                testID="Open level 3 menu">
                <ButtonText>Open level 3 menu</ButtonText>
              </Button>
            )}
          </Menu.Trigger>
          <Menu.Outer>
            <Menu.Group>
              <Menu.Item
                label="Open level 4 prompt"
                onPress={() => promptControl.open()}>
                <Menu.ItemText>Open level 4 prompt</Menu.ItemText>
              </Menu.Item>
              <Menu.Item label="Do nothing" onPress={() => {}}>
                <Menu.ItemText>Do nothing</Menu.ItemText>
              </Menu.Item>
            </Menu.Group>
          </Menu.Outer>
        </Menu.Root>
      </View>
      <Prompt.Basic
        control={promptControl}
        title="Level 4 prompt"
        description="Declared inside the level 2 dialog, opened from the level 3 menu."
        confirmButtonCta="Confirm"
        onConfirm={() => setConfirmed(c => c + 1)}
      />
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

/**
 * The state lives above Dialog.Outer. With the state-based portal, the input
 * re-rendered a pass late and native reverted the text (APP-3447).
 */
function ControlledInputAbove() {
  const control = Dialog.useDialogControl()
  const [value, setValue] = useState('')
  return (
    <>
      <OpenButton
        label="2. Open controlled input (state above Outer)"
        onPress={() => control.open()}
      />
      <Text>Owner sees: “{value}”</Text>
      <Dialog.Outer control={control} testID="controlled">
        <Dialog.Handle />
        <Dialog.ScrollableInner label="Controlled input">
          <View style={[a.gap_md]}>
            <H3>Controlled input</H3>
            <Text>
              Type fast, then move the cursor to the middle and type again. The
              cursor shouldn’t jump and characters shouldn’t drop.
            </Text>
            <TextField.Root>
              <Dialog.Input
                testID="controlledInput"
                label="Controlled input"
                value={value}
                onChangeText={setValue}
                multiline
              />
            </TextField.Root>
            <Text>{value.length} characters</Text>
          </View>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

const ROWS = Array.from({length: 100}, (_, i) => `Row ${i + 1}`)

/**
 * A dialog list declared inside a cell of the app's vertical `List`. Without
 * resetting the list context it registers as a nested child of the outer list
 * and stops rendering rows past the first batch.
 */
function DialogInListCell() {
  const list = (
    <List
      scrollEnabled={false}
      data={['cell']}
      keyExtractor={(item: string) => item}
      renderItem={() => <ListCellDialog />}
    />
  )
  /*
   * Silences the storybook's own nested-in-ScrollView warning. RNW's
   * ScrollView has no Context.
   */
  return IS_NATIVE ? (
    <ScrollView.Context value={null}>{list}</ScrollView.Context>
  ) : (
    list
  )
}

function ListCellDialog() {
  const control = Dialog.useDialogControl()
  return (
    <View>
      <OpenButton
        label="3. Open 100-row list from a List cell"
        onPress={() => control.open()}
      />
      <Dialog.Outer control={control} testID="listCell">
        <Dialog.Handle />
        <Dialog.InnerFlatList
          data={ROWS}
          keyExtractor={(item: string) => item}
          ListHeaderComponent={<KeyboardTapCheck />}
          renderItem={({item}: {item: string}) => (
            <Text style={[a.py_md, a.text_md]}>{item}</Text>
          )}
        />
      </Dialog.Outer>
    </View>
  )
}

/**
 * The outer list's capture-phase responder sees taps inside the sheet. With
 * keyboardShouldPersistTaps="never" (the ScrollView default), the first tap on
 * the button below would only dismiss the keyboard and the count wouldn't
 * change. `List` defaults to "handled", so every tap should count.
 */
function KeyboardTapCheck() {
  const [taps, setTaps] = useState(0)
  return (
    <View style={[a.gap_sm, a.py_md]}>
      <TextField.Root>
        <Dialog.Input
          testID="keyboardTapInput"
          label="Focus me to raise the keyboard"
          placeholder="Focus me to raise the keyboard"
        />
      </TextField.Root>
      <OpenButton
        label={`Tap me with the keyboard up (${taps})`}
        onPress={() => setTaps(t => t + 1)}
      />
    </View>
  )
}

/**
 * Declared under a forced dark theme, like the video feed. The dialog should
 * match the subtree it's declared in, sheet and content alike.
 */
function DarkThemeDialog() {
  return (
    <ThemeProvider theme="dark">
      <DarkThemeDialogInner />
    </ThemeProvider>
  )
}

function DarkThemeDialogInner() {
  const t = useTheme()
  const control = Dialog.useDialogControl()
  return (
    <View style={[a.gap_sm, a.p_md, a.rounded_md, t.atoms.bg_contrast_25]}>
      <Text>This block is forced to the {t.name} theme.</Text>
      <OpenButton
        label="4. Open dialog from a dark subtree"
        onPress={() => control.open()}
      />
      <Dialog.Outer control={control} testID="darkTheme">
        <Dialog.Handle />
        <ThemeReport />
      </Dialog.Outer>
    </View>
  )
}

function ThemeReport() {
  const t = useTheme()
  return (
    <Dialog.ScrollableInner label="Theme check">
      <H3>Theme inside the dialog: {t.name}</H3>
      <Text>It should be “dark”, like the subtree it’s declared in.</Text>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

/**
 * Like a hashtag in a post: the menu is declared inside a <Text>.
 */
function InlineTextMenu() {
  return (
    <View style={[a.gap_sm]}>
      <Text style={[a.text_md]}>
        5. Long-press (native) or click (web) the tag:
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>
        This sentence wraps over a couple of lines and has an inline{' '}
        <InlineTag /> in the middle, so the text should not reflow while its
        menu is open, and the dialog it opens should present too.
      </Text>
    </View>
  )
}

function InlineTag() {
  const t = useTheme()
  const dialogControl = Dialog.useDialogControl()
  return (
    <>
      <Menu.Root>
        <Menu.Trigger label="Inline tag menu">
          {({props}) => (
            <Text
              {...props}
              onLongPress={props.onPress}
              testID="inlineTag"
              style={[
                a.text_md,
                a.font_semi_bold,
                {color: t.palette.primary_500},
              ]}>
              #inlinetag
            </Text>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              label="Open a dialog from the inline menu"
              onPress={() => dialogControl.open()}>
              <Menu.ItemText>Open a dialog from the inline menu</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
      <Dialog.Outer control={dialogControl} testID="inlineDialog">
        <Dialog.Handle />
        <Dialog.ScrollableInner label="Inline dialog">
          <H3>Dialog declared inside a Text</H3>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

/**
 * Dialogs opened while the gate is closed should wait, then present once it
 * opens, like the shell does behind the policy update overlay.
 */
function GatedDialog() {
  const [enabled, setEnabled] = useState(false)
  const control = Dialog.useDialogControl()
  return (
    <Dialog.PresentationGate enabled={enabled}>
      <View style={[a.gap_sm]}>
        <Text>Gate is {enabled ? 'open' : 'closed'}</Text>
        <View style={[a.flex_row, a.gap_sm]}>
          <OpenButton
            label="6. Open gated dialog"
            onPress={() => control.open()}
          />
          <OpenButton
            label={enabled ? 'Close gate' : 'Open gate'}
            onPress={() => setEnabled(e => !e)}
          />
        </View>
      </View>
      <Dialog.Outer control={control} testID="gated">
        <Dialog.Handle />
        <Dialog.ScrollableInner label="Gated dialog">
          <H3>Gated dialog</H3>
          <Text>This only appears once the gate is open.</Text>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </Dialog.PresentationGate>
  )
}

/**
 * The dialog's React ancestors include this Pressable. Tapping blank space in
 * the dialog must not count as a press on it.
 */
function DialogInsidePressable() {
  const t = useTheme()
  const control = Dialog.useDialogControl()
  const [presses, setPresses] = useState(0)
  return (
    <Pressable
      // Not a button, so web doesn't nest the open button in a <button>.
      accessibilityRole="none"
      accessibilityLabel="Owner Pressable"
      accessibilityHint="Counts presses"
      testID="ownerPressable"
      onPress={() => setPresses(p => p + 1)}
      style={[a.gap_sm, a.p_md, a.rounded_md, t.atoms.bg_contrast_25]}>
      <Text>Owner Pressable presses: {presses}</Text>
      <OpenButton
        label="7. Open dialog declared inside a Pressable"
        onPress={() => control.open()}
      />
      <Dialog.Outer control={control} testID="insidePressable">
        <Dialog.Handle />
        <Dialog.ScrollableInner label="Inside a Pressable">
          <View style={[a.gap_md]}>
            <H3>Tap the blank area below</H3>
            <Text>Owner Pressable presses: {presses}</Text>
            <View
              testID="blankArea"
              style={[a.rounded_md, t.atoms.bg_contrast_25, {height: 200}]}
            />
            <Text>The count must stay the same.</Text>
          </View>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </Pressable>
  )
}

/**
 * The sheet dispatches its own touches, in coordinates relative to the sheet,
 * so `measure()` inside it has to be relative to the sheet too. Otherwise
 * Pressability measures the button somewhere else and cancels a press as soon
 * as the finger moves. This case sits at the bottom of the section, far from
 * the screen origin.
 */
function MeasureInSheet() {
  const control = Dialog.useDialogControl()
  return (
    <View>
      <OpenButton
        label="8. Open measure() check"
        onPress={() => control.open()}
      />
      <Dialog.Outer control={control} testID="measure">
        <Dialog.Handle />
        <MeasureReport />
      </Dialog.Outer>
    </View>
  )
}

function MeasureReport() {
  const ref = useRef<React.ComponentRef<typeof View>>(null)
  const [pageY, setPageY] = useState<number | null>(null)
  const [presses, setPresses] = useState(0)
  return (
    <Dialog.ScrollableInner label="Measure check">
      <View style={[a.gap_md]}>
        <H3>measure() inside a sheet</H3>
        <Text>
          pageY should be small, measured from the top of the sheet, however far
          down the page this dialog is declared.
        </Text>
        <View ref={ref} collapsable={false}>
          <OpenButton
            label={`Measure me (pageY: ${pageY ?? '?'})`}
            onPress={() =>
              ref.current?.measure((_x, _y, _width, _height, _pageX, y) =>
                setPageY(Math.round(y)),
              )
            }
          />
        </View>
        <Text>
          Press, drag a few points without leaving the button, then let go. The
          count should still go up.
        </Text>
        <OpenButton
          label={`Drag-press me (${presses})`}
          onPress={() => setPresses(p => p + 1)}
        />
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
