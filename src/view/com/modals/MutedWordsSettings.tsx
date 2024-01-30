import React from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  Pressable,
  FlatList,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useMutedWords, useToggleWordMute} from '#/state/muted-words'
import {useModalControls} from '#/state/modals'
import {usePalette} from 'lib/hooks/usePalette'
import {gradients, s} from 'lib/styles'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

export const snapPoints = ['90%']

export function Component() {
  const mutedWordsFromStore = useMutedWords()
  const toggleWordMute = useToggleWordMute()
  const [newWord, setNewWord] = React.useState('')
  const {closeModal} = useModalControls()
  const pal = usePalette('default')

  const [reversedWords, setReversedWords] = React.useState(
    [...mutedWordsFromStore].reverse(),
  )

  React.useEffect(() => {
    setReversedWords([...mutedWordsFromStore].reverse())
  }, [mutedWordsFromStore])

  const handleAddWord = () => {
    if (newWord.trim() !== '') {
      setNewWord('')
      toggleWordMute(newWord)
      setReversedWords([newWord, ...reversedWords])
    }
  }

  const renderWord = ({item}: {item: string}) => (
    <View style={[styles.wordContainer, pal.view]}>
      <Text style={[styles.word, pal.text]}>{item}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          toggleWordMute(item)
          setReversedWords(reversedWords.filter(word => word !== item))
        }}>
        <FontAwesomeIcon icon={['fas', 'times']} size={20} color="red" />
      </Pressable>
    </View>
  )

  return (
    <View style={[styles.modalContainer, pal.view]}>
      <View style={[styles.modalHeader, pal.view]}>
        <Text style={[styles.modalTitle, pal.text, s.bold]}>Muted Words</Text>
        <Pressable accessibilityRole="button" onPress={closeModal}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.doneButtonGradient}>
            <Text style={[s.white, s.bold]}>Done</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={[styles.container, pal.view]}>
        <View style={styles.inputContainer}>
          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Add a word to mute"
            style={[styles.input, pal.border]}
            onChangeText={setNewWord}
            onSubmitEditing={handleAddWord}
            value={newWord}
            placeholder="Add a word to mute"
          />
          <Pressable
            accessibilityRole="button"
            onPress={handleAddWord}
            style={styles.addButton}>
            <LinearGradient
              colors={[gradients.blueLight.start, gradients.blueLight.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.addButtonGradient}>
              <FontAwesomeIcon icon={['fas', 'plus']} size={20} color="white" />
            </LinearGradient>
          </Pressable>
        </View>

        <FlatList
          data={reversedWords}
          renderItem={renderWord}
          keyExtractor={item => item}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  doneButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  removeButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  container: {
    flex: 1,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  word: {
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    paddingHorizontal: 10,
  },
  addButton: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 20,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
