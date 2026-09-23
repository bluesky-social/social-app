import {useState} from 'react'
import {View} from 'react-native'

import {atoms as a, tokens, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {H3, P, Text} from '#/components/Typography'
import {BottomSheetSnapPoint} from '../../../../modules/bottom-sheet'

const TALL_ROWS = Array.from({length: 30}, (_, index) => index + 1)
const MAX_HEIGHT_ROWS = Array.from({length: 20}, (_, index) => index + 1)

function OpenButton({
  text,
  onPress,
  testID,
}: {
  text: string
  onPress: () => void
  testID: string
}) {
  return (
    <Button
      color="secondary"
      size="small"
      onPress={onPress}
      label={text}
      testID={testID}>
      <ButtonText>{text}</ButtonText>
    </Button>
  )
}

function FooterButton({
  text,
  onPress,
  testID,
}: {
  text: string
  onPress: () => void
  testID: string
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.border_t,
        a.px_xl,
        a.pt_md,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        {paddingBottom: tokens.space.xl},
      ]}>
      <Button
        color="primary"
        size="large"
        onPress={onPress}
        label={text}
        testID={testID}>
        <ButtonText>{text}</ButtonText>
      </Button>
    </View>
  )
}

function RowText({
  children,
  testID,
}: {
  children: React.ReactNode
  testID?: string
}) {
  const t = useTheme()

  return (
    <Text
      testID={testID}
      style={[a.border_b, a.py_md, t.atoms.border_contrast_low]}>
      {children}
    </Text>
  )
}

function SnapPointText({testID}: {testID: string}) {
  const {nativeSnapPoint} = Dialog.useDialogContext()
  const label =
    nativeSnapPoint === BottomSheetSnapPoint.Full ? 'Full' : 'Partial'

  return <Text testID={testID}>Snap point: {label}</Text>
}

export function BottomSheets() {
  const small = Dialog.useDialogControl()
  const tall = Dialog.useDialogControl()
  const fullHeight = Dialog.useDialogControl()
  const maxHeight = Dialog.useDialogControl()
  const dynamic = Dialog.useDialogControl()
  const keyboard = Dialog.useDialogControl()
  const infinite = Dialog.useDialogControl()
  const [dynamicIsExpanded, setDynamicIsExpanded] = useState(false)
  const [infiniteRowCount, setInfiniteRowCount] = useState(20)
  const [infiniteFooterHeight, setInfiniteFooterHeight] = useState(0)
  const infiniteRows = Array.from(
    {length: infiniteRowCount},
    (_, index) => index + 1,
  )

  return (
    <View style={a.gap_md} testID="bottomSheetTestCases">
      <H3>Bottom sheet layout test cases</H3>
      <P>
        These cover intrinsic, constrained, scrolling, keyboard, and changing
        content layouts. Keep their test IDs stable for Maestro.
      </P>

      <OpenButton
        text="Open small sheet"
        onPress={small.open}
        testID="bottomSheetSmallOpen"
      />
      <OpenButton
        text="Open oversized sheet"
        onPress={tall.open}
        testID="bottomSheetTallOpen"
      />
      <OpenButton
        text="Open full-height sheet"
        onPress={fullHeight.open}
        testID="bottomSheetFullHeightOpen"
      />
      <OpenButton
        text="Open max-height sheet"
        onPress={maxHeight.open}
        testID="bottomSheetMaxHeightOpen"
      />
      <OpenButton
        text="Open changing-height sheet"
        onPress={() => {
          setDynamicIsExpanded(false)
          dynamic.open()
        }}
        testID="bottomSheetDynamicOpen"
      />
      <OpenButton
        text="Open keyboard sheet"
        onPress={keyboard.open}
        testID="bottomSheetKeyboardOpen"
      />
      <OpenButton
        text="Open infinite-list sheet"
        onPress={() => {
          setInfiniteRowCount(20)
          infinite.open()
        }}
        testID="bottomSheetInfiniteOpen"
      />

      <Dialog.Outer control={small} testID="bottomSheetSmall">
        <Dialog.ScrollableInner label="Small bottom sheet">
          <H3>Small sheet</H3>
          <P testID="bottomSheetSmallContent">
            This sheet should hug one short block of content.
          </P>
          <Button
            color="primary"
            size="small"
            label="Close small sheet"
            onPress={() => small.close()}
            testID="bottomSheetSmallClose">
            <ButtonText>Done</ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <Dialog.Outer control={tall} testID="bottomSheetTall">
        <Dialog.ScrollableInner label="Oversized bottom sheet">
          <H3>Oversized sheet</H3>
          <P testID="bottomSheetTallStart">
            Its content is taller than the available canvas and must scroll.
          </P>
          <Button
            color="secondary"
            size="small"
            label="Close oversized sheet"
            onPress={() => tall.close()}
            testID="bottomSheetTallClose">
            <ButtonText>Close oversized sheet</ButtonText>
          </Button>
          {TALL_ROWS.map(row => (
            <RowText key={row}>Oversized row {row}</RowText>
          ))}
          <Button
            color="primary"
            size="large"
            label="Close oversized sheet"
            onPress={() => tall.close()}
            testID="bottomSheetTallEnd">
            <ButtonText>Reached oversized end</ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <Dialog.Outer
        control={fullHeight}
        nativeOptions={{fullHeight: true}}
        testID="bottomSheetFullHeight">
        <Dialog.InnerFlatList
          data={[1, 2, 3]}
          keyExtractor={item => String(item)}
          contentContainerStyle={{paddingBottom: 100}}
          renderItem={({item}) => <RowText>Full-height row {item}</RowText>}
          ListHeaderComponent={
            <>
              <H3>Full-height sheet</H3>
              <P testID="bottomSheetFullHeightContent">
                A short virtualized list should still fill the canvas and keep
                its pinned footer visible.
              </P>
            </>
          }
          footer={
            <Dialog.FlatListFooter>
              <Button
                color="primary"
                size="large"
                label="Close full-height sheet"
                onPress={() => fullHeight.close()}
                testID="bottomSheetFullHeightDone">
                <ButtonText>Done</ButtonText>
              </Button>
            </Dialog.FlatListFooter>
          }
        />
      </Dialog.Outer>

      <Dialog.Outer
        control={maxHeight}
        nativeOptions={{maxHeight: 360}}
        testID="bottomSheetMaxHeight">
        <Dialog.ScrollableInner
          label="Max-height bottom sheet"
          footer={
            <FooterButton
              text="Done"
              onPress={() => maxHeight.close()}
              testID="bottomSheetMaxHeightDone"
            />
          }>
          <H3>Max-height sheet</H3>
          <SnapPointText testID="bottomSheetMaxHeightSnapPoint" />
          <P>This sheet must remain within a 360-point canvas.</P>
          {MAX_HEIGHT_ROWS.map(row => (
            <RowText
              key={row}
              testID={
                row === MAX_HEIGHT_ROWS.length
                  ? 'bottomSheetMaxHeightEnd'
                  : undefined
              }>
              Max-height row {row}
            </RowText>
          ))}
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <Dialog.Outer control={dynamic} testID="bottomSheetDynamic">
        <Dialog.ScrollableInner
          label="Changing-height bottom sheet"
          footer={
            <FooterButton
              text={dynamicIsExpanded ? 'Shrink content' : 'Grow content'}
              onPress={() => setDynamicIsExpanded(value => !value)}
              testID="bottomSheetDynamicToggle"
            />
          }>
          <H3>Changing-height sheet</H3>
          <P testID="bottomSheetDynamicState">
            {dynamicIsExpanded ? 'Expanded content' : 'Compact content'}
          </P>
          {(dynamicIsExpanded ? TALL_ROWS : [1, 2]).map(row => (
            <RowText key={row}>Dynamic row {row}</RowText>
          ))}
          <Button
            color="secondary"
            size="small"
            label="Close changing-height sheet"
            onPress={() => dynamic.close()}
            testID="bottomSheetDynamicDone">
            <ButtonText>Done</ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <Dialog.Outer
        control={keyboard}
        nativeOptions={{fullHeight: true}}
        testID="bottomSheetKeyboard">
        <Dialog.ScrollableInner
          label="Keyboard bottom sheet"
          footer={
            <FooterButton
              text="Done"
              onPress={() => keyboard.close()}
              testID="bottomSheetKeyboardDone"
            />
          }>
          <H3>Keyboard sheet</H3>
          <P>
            The footer must remain reachable as the keyboard opens and closes.
          </P>
          <Dialog.Input
            defaultValue=""
            label="Bottom sheet test input"
            placeholder="Type here"
            testID="bottomSheetKeyboardInput"
          />
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <Dialog.Outer
        control={infinite}
        nativeOptions={{fullHeight: true}}
        testID="bottomSheetInfinite">
        <Dialog.InnerFlatList
          data={infiniteRows}
          keyExtractor={item => String(item)}
          contentContainerStyle={{
            paddingBottom: infiniteFooterHeight + tokens.space.xl,
          }}
          scrollIndicatorInsets={{bottom: infiniteFooterHeight}}
          renderItem={({item}) => (
            <RowText testID={`bottomSheetInfiniteRow-${item}`}>
              Infinite row {item}
            </RowText>
          )}
          ListHeaderComponent={
            <>
              <H3>Infinite-list sheet</H3>
              <P>
                Loading another page must preserve scrolling and the footer.
              </P>
            </>
          }
          footer={
            <Dialog.FlatListFooter
              onLayout={event =>
                setInfiniteFooterHeight(event.nativeEvent.layout.height)
              }>
              <View style={a.gap_sm}>
                <Button
                  color="secondary"
                  size="large"
                  label="Load more bottom sheet rows"
                  onPress={() => setInfiniteRowCount(count => count + 20)}
                  testID="bottomSheetInfiniteLoadMore">
                  <ButtonText>Load more rows</ButtonText>
                </Button>
                <Button
                  color="primary"
                  size="large"
                  label="Close infinite-list sheet"
                  onPress={() => infinite.close()}
                  testID="bottomSheetInfiniteDone">
                  <ButtonText>Done</ButtonText>
                </Button>
              </View>
            </Dialog.FlatListFooter>
          }
        />
      </Dialog.Outer>
    </View>
  )
}
