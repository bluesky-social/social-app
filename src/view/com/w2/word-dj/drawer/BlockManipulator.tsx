import React, {useCallback} from 'react'
import {View, StyleSheet} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {
  BlockManipulatorModel,
  QUOTES,
  Quote,
  TONES,
  Tone,
} from 'state/models/w2/BlockManipulatorModel'
import {observer} from 'mobx-react-lite'
import {SmallButton} from './SmallButton'
import {DiceIcon, KeyboardIcon, ScissorsIcon, ThrashIcon} from 'lib/icons-w2'
import {InfoRow} from './InfoRow'
import {TextBox} from './TextBox'
import {LargeButton} from './LargeButton'
import {Header} from './Header'
import {IsQuote} from '../../util/Quote'

interface Props {
  onRemoveBlock: () => void
  onSplit: (part1: string, part2: string) => void
  model: BlockManipulatorModel
}

export const BlockManipulator = observer(function BlockManipulator({
  onRemoveBlock,
  onSplit,
  model,
}: Props) {
  const pal = usePalette('primary')

  const disableAll = model.state !== 'idle'
  const isGenerating = model.state === 'generating'

  const onSplitInt = useCallback(() => {
    const [part1, part2] = model.split()
    if (part2) onSplit(part1, part2)
  }, [model, onSplit])

  if (model.isShowingCustomTextBox) {
    return (
      <View style={styles.noGapOrMargin}>
        <Header title={'Ideas'} onBack={model.hideCustomTextBox} />
        <TextBox
          placeholder="Type your own"
          returnKeyType="go"
          onSubmitEditing={a => model.onCustomIdeaSubmitted(a.nativeEvent.text)}
          style={styles.textBox}
        />
      </View>
    )
  } else {
    const quoteBlock = IsQuote(model.text)
    return (
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <SmallButton
            text="Remove"
            width="flex"
            icon={<ThrashIcon size={17} style={pal.text} />}
            onPress={onRemoveBlock}
          />
          <SmallButton
            text="Split"
            width="flex"
            icon={<ScissorsIcon size={17} style={pal.text} />}
            disabled={!model.canSplit}
            onPress={onSplitInt}
          />
          <SmallButton
            text="Rewrite"
            width="flex"
            icon={<DiceIcon size={17} style={pal.text} />}
            spinnerAsIcon={isGenerating}
            disabled={isGenerating}
            onPress={model.rewrite}
          />
        </View>
        {quoteBlock.bIsQuote && (
          <InfoRow<Quote>
            title="Quotes"
            values={QUOTES}
            selection={model.quote}
            open={model.isQuoteOpen}
            useDarkButtons={false}
            oldScrollPos={model.quoteScrollPos}
            setSavedScrollPos={model.setSavedQuoteScrollPos}
            onOpen={model.openQuote}
            onSelected={model.setQuote}
            disabled={disableAll}
          />
        )}
        <InfoRow<Tone>
          title={model.isToneOpen ? undefined : 'Tone'}
          values={TONES}
          selection={model.tone}
          open={model.isToneOpen}
          useDarkButtons={false}
          oldScrollPos={model.toneScrollPos}
          setSavedScrollPos={model.setSavedToneScrollPos}
          onOpen={model.openTone}
          onSelected={model.setTone}
          disabled={disableAll}
        />
        {/* <InfoRow<Length>
            title="Length"
            values={LENGTHS}
            selection={model.length}
            open={model.isLengthOpen}
            useDarkButtons={false}
            oldScrollPos={model.lengthScrollPos}
            setSavedScrollPos={model.setSavedLengthScrollPos}
            onOpen={model.openLength}
            onSelected={model.setLength}
            disabled={disableAll}
          /> */}
        {model.isShowingCustomTextBox && (
          <TextBox
            placeholder="Type your own"
            returnKeyType="go"
            autoFocus
            onSubmitEditing={a =>
              model.onCustomIdeaSubmitted(a.nativeEvent.text)
            }
            style={styles.textBox}
          />
        )}
        {!model.isShowingCustomTextBox && (
          <LargeButton
            variant="empty"
            text="Type your own"
            icon={<KeyboardIcon size={24} style={pal.textLight} />}
            onPress={model.showCustomTextBox}
          />
        )}
      </View>
    )
  }
})

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 2,
  },
  buttonRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textBox: {
    marginVertical: 8,
  },
  noGapOrMargin: {
    margin: 12,
  },
})
