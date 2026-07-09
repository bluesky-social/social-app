import {useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TextInput, View} from 'react-native'

import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

const LONG_TEXT =
  'This selectable text row intentionally contains a long run of text and nested spans to exercise RNUITextView child insertion and repeated native allocation on iOS 26. '

export function Ios26CrashRegressionScreen() {
  const [layoutPass, setLayoutPass] = useState(0)
  const [rows, setRows] = useState(18)
  const [showSelectable, setShowSelectable] = useState(true)
  const [inputValue, setInputValue] = useState('')

  const layoutRows = useMemo(
    () =>
      Array.from({length: rows}, (_, i) => ({
        id: `layout-${layoutPass}-${i}`,
        basis: 34 + ((i + layoutPass) % 5) * 13,
        grow: (i + layoutPass) % 3,
        margin: ((i * 7 + layoutPass) % 12) + 1,
        padding: ((i * 5 + layoutPass) % 10) + 2,
      })),
    [layoutPass, rows],
  )

  return (
    <Layout.Screen testID="ios26CrashRegressionScreen">
      <ScrollView
        testID="ios26CrashRegressionScroll"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.controls}>
          <Button
            label="Mutate layout"
            testID="ios26MutateYogaLayout"
            variant="solid"
            color="primary"
            size="small"
            onPress={() => setLayoutPass(pass => pass + 1)}>
            <ButtonText>Mutate layout</ButtonText>
          </Button>
          <Button
            label="Add rows"
            testID="ios26AddCrashRows"
            variant="solid"
            color="secondary"
            size="small"
            onPress={() => setRows(count => count + 8)}>
            <ButtonText>Add rows</ButtonText>
          </Button>
          <Button
            label="Toggle selectable text"
            testID="ios26ToggleSelectableText"
            variant="solid"
            color="secondary"
            size="small"
            onPress={() => setShowSelectable(value => !value)}>
            <ButtonText>Toggle text</ButtonText>
          </Button>
        </View>

        <View testID="ios26YogaStressTree" style={styles.yogaRoot}>
          {layoutRows.map((row, i) => (
            <View
              key={row.id}
              style={[
                styles.yogaRow,
                {
                  flexBasis: row.basis,
                  flexGrow: row.grow,
                  marginEnd: row.margin,
                  paddingEnd: row.padding,
                  marginStart: row.padding,
                  paddingStart: row.margin,
                },
              ]}>
              <View style={[styles.yogaChild, i % 2 === 0 && styles.flexEnd]}>
                <Text numberOfLines={1}>layout row {i}</Text>
              </View>
            </View>
          ))}
        </View>

        <TextInput
          testID="ios26CrashRegressionInput"
          accessibilityLabel="iOS 26 crash regression input"
          accessibilityHint="Focuses the crash regression input while layout and selectable text are mutating"
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Focus while layout and selectable text are mutating"
          autoCorrect={false}
        />

        {showSelectable ? (
          <View testID="ios26SelectableTextContainer">
            {Array.from({length: Math.min(rows, 36)}, (_, i) => (
              <Text
                key={`${layoutPass}-${i}`}
                testID={`ios26SelectableCrashRow-${i}`}
                selectable
                emoji
                numberOfLines={i % 3 === 0 ? 2 : undefined}
                style={styles.selectableText}>
                {LONG_TEXT}
                <Text>Nested span {i}</Text>
              </Text>
            ))}
          </View>
        ) : (
          <Text testID="ios26SelectableTextUnmounted">
            Selectable text unmounted
          </Text>
        )}
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 120,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yogaRoot: {
    alignContent: 'stretch',
    borderColor: '#c7c7c7',
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 260,
    padding: 8,
  },
  yogaRow: {
    borderColor: '#999',
    borderWidth: 1,
    flexDirection: 'row',
    minWidth: 72,
  },
  yogaChild: {
    flex: 1,
    justifyContent: 'center',
  },
  flexEnd: {
    alignItems: 'flex-end',
  },
  input: {
    borderColor: '#777',
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  selectableText: {
    marginBottom: 12,
  },
})
