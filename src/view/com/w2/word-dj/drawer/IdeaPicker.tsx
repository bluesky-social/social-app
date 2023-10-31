import React, {useCallback, useEffect, useRef} from 'react'
import {View, StyleSheet, TextInput, ActivityIndicator} from 'react-native'
import {Header} from './Header'
import {LargeButton} from './LargeButton'
import {KeyboardIcon} from 'lib/icons-w2'
import {usePalette} from 'lib/hooks/usePalette'
import {IdeasModel} from 'state/models/w2/IdeasModel'
import {observer} from 'mobx-react-lite'
import {TextBox} from './TextBox'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {InfoRow} from './InfoRow'
import {
  LENGTHS,
  Length,
  TONES,
  Tone,
} from 'state/models/w2/BlockManipulatorModel'

const TITLE = 'Ideas'

interface Props {
  model: IdeasModel
  allBlocksText: string
  nonQuotesBlocksText: string
  hideTone: boolean
  hideLength: boolean
  showOptionsDuringCustomText: boolean
}

export const IdeaPicker = observer(function IdeaPicker({
  model,
  allBlocksText,
  nonQuotesBlocksText,
  hideTone,
  hideLength,
  showOptionsDuringCustomText,
}: Props) {
  const pal = usePalette('primary')

  const disableAll = model.state !== 'idle'
  const textBoxRef = useRef<TextInput>(null)
  const [toneScrollPos, setSavedToneScrollPos] = React.useState(0)
  const [lengthScrollPos, setSavedLengthScrollPos] = React.useState(0)

  useEffect(() => {
    if (model.isShowingCustomTextBox) {
      if (textBoxRef.current) textBoxRef.current.focus()
    } else {
      if (textBoxRef.current) textBoxRef.current.blur()
    }
  }, [model.isShowingCustomTextBox])

  const onClose = useCallback(() => {
    if (textBoxRef.current) textBoxRef.current.blur()
    model.cancel()
    setSavedToneScrollPos(0)
    setSavedLengthScrollPos(0)
  }, [model])

  const onCustomIdeaSelected = useCallback(() => {
    model.generateIdea('custom', allBlocksText, nonQuotesBlocksText)
    setSavedToneScrollPos(0)
    setSavedLengthScrollPos(0)
  }, [model, allBlocksText, nonQuotesBlocksText])

  const onIdeaSelectedFromList = useCallback(
    (ideaIndex: number) => {
      model.generateIdea(ideaIndex, allBlocksText, nonQuotesBlocksText)
      setSavedToneScrollPos(0)
      setSavedLengthScrollPos(0)
    },
    [model, allBlocksText, nonQuotesBlocksText],
  )

  if (model.isShowingCustomTextBox) {
    return (
      <View style={styles.noGapOrMargin}>
        <Header title={TITLE} onBack={model.showList} onClose={onClose} />
        {showOptionsDuringCustomText && !hideTone && (
          <InfoRow<Tone>
            title={model.isToneOpen ? undefined : 'Tone'}
            values={TONES}
            selection={model.tone}
            open={model.isToneOpen}
            useDarkButtons={true}
            oldScrollPos={toneScrollPos}
            setSavedScrollPos={setSavedToneScrollPos}
            onOpen={model.openTone}
            onSelected={model.setTone}
            disabled={disableAll}
          />
        )}
        {showOptionsDuringCustomText && !hideLength && (
          <InfoRow<Length>
            title="Length"
            values={LENGTHS}
            selection={model.length}
            open={model.isLengthOpen}
            useDarkButtons={true}
            oldScrollPos={lengthScrollPos}
            setSavedScrollPos={setSavedLengthScrollPos}
            onOpen={model.openLength}
            onSelected={model.setLength}
            disabled={disableAll}
          />
        )}
        <TextBox
          ref={textBoxRef}
          placeholder="Type your own"
          returnKeyType="go"
          value={model.customIdea}
          onChangeText={model.setCustomIdea}
          onSubmitEditing={onCustomIdeaSelected}
          style={styles.textBox}
        />
      </View>
    )
  } else {
    return (
      <View style={styles.noGapOrMargin}>
        <Header title={TITLE} onClose={onClose} />
        <View style={styles.heightPad} />
        {!hideLength && (
          <InfoRow<Length>
            title="Length"
            values={LENGTHS}
            selection={model.length}
            open={model.isLengthOpen}
            useDarkButtons={true}
            oldScrollPos={lengthScrollPos}
            setSavedScrollPos={setSavedLengthScrollPos}
            onOpen={model.openLength}
            onSelected={model.setLength}
            disabled={disableAll}
          />
        )}
        {/* <ScrollView style={[pal.viewInvertedLight, styles.scrollStyle]}> */}
        <View
          style={
            !hideTone
              ? styles.container_nonFixedHeight
              : styles.container_FixedHeight
          }>
          {model.state === 'loading' ? (
            <View style={[styles.generating]}>
              <Text type="lg" style={[pal.textLight, s.textCenter]}>
                Generating ideas...
              </Text>
              <ActivityIndicator size="small" color={pal.textLight.color} />
            </View>
          ) : (
            model.ideas.map((idea, i) => (
              <LargeButton
                key={idea.key}
                text={idea.text}
                onPress={() => onIdeaSelectedFromList(i)}
              />
            ))
          )}
          <View style={styles.heightPad} />
          {!hideTone && (
            <InfoRow<Tone>
              title={model.isToneOpen ? undefined : 'Tone'}
              values={TONES}
              selection={model.tone}
              open={model.isToneOpen}
              useDarkButtons={true}
              oldScrollPos={toneScrollPos}
              setSavedScrollPos={setSavedToneScrollPos}
              onOpen={model.openTone}
              onSelected={model.setTone}
              disabled={disableAll}
            />
          )}
          <LargeButton
            variant="empty"
            text="Type your own"
            icon={<KeyboardIcon size={24} style={pal.textLight} />}
            onPress={model.showCustomTextBox}
          />

          {/* </ScrollView> */}
        </View>
      </View>
    )
  }
})

const styles = StyleSheet.create({
  container_FixedHeight: {
    margin: 12,
    height: 360,
    gap: 12,
  },
  container_nonFixedHeight: {
    margin: 12,
    gap: 12,
  },
  noGapOrMargin: {
    margin: 12,
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  heightPad: {
    height: 26,
  },
  generating: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  textBox: {
    marginVertical: 8,
  },
  scrollStyle: {
    borderRadius: 16,
  },
})
