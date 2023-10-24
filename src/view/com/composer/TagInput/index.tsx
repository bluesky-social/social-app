import React from 'react'
import {
  View,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet'

import {Portal} from 'view/com/util/Portal'
import {TagsAutocompleteModel} from 'state/models/ui/tags-autocomplete'
import {usePalette} from 'lib/hooks/usePalette'
import {TagButton} from 'view/com/Tag'
import * as Sheet from 'view/com/sheets/Base'
import {useStores} from 'state/index'
import {ActivityIndicator} from 'react-native'
import {TagInputEntryButton} from './TagInputEntryButton'
import {uniq} from 'lib/strings/helpers'
import {sanitizeHashtag} from './util'

export function TagInput({
  max = 8,
  initialTags = [],
  onChangeTags,
}: {
  max?: number
  initialTags?: string[]
  onChangeTags: (tags: string[]) => void
}) {
  const store = useStores()
  const model = React.useMemo(() => new TagsAutocompleteModel(store), [store])
  const pal = usePalette('default')
  const input = React.useRef<TextInput>(null)

  const [value, setValue] = React.useState('')
  const [tags, setTags] = React.useState<string[]>(initialTags)
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)

  const sheet = React.useRef<BottomSheet>(null)

  const reset = React.useCallback(() => {
    setValue('')
    model.setActive(false)
    model.clear()
    setSuggestions([])
  }, [model, setValue, setSuggestions])

  const addTags = React.useCallback(
    (_tags: string[]) => {
      setTags(_tags)
      onChangeTags(_tags)
    },
    [onChangeTags, setTags],
  )

  const removeTag = React.useCallback(
    (tag: string) => {
      addTags(tags.filter(t => t !== tag))
    },
    [tags, addTags],
  )

  const addTagAndReset = React.useCallback(
    (value: string) => {
      const tag = sanitizeHashtag(value)

      // enforce max hashtag length
      if (tag.length > 0 && tag.length <= 64) {
        addTags(uniq([...tags, tag]).slice(0, max))
      }

      setValue('')
    },
    [max, tags, setValue, addTags],
  )

  const onSubmitEditing = React.useCallback(() => {
    addTagAndReset(value)
  }, [value, addTagAndReset])

  const onKeyPress = React.useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const {key} = e.nativeEvent

      if (key === 'Backspace' && value === '') {
        addTags(tags.slice(0, -1))
      } else if (key === ' ') {
        addTagAndReset(value)
        setTimeout(() => {
          setValue('')
        }, 1)
      }
    },
    [value, tags, addTags, addTagAndReset],
  )

  const onChangeText = React.useCallback(
    async (v: string) => {
      setValue(v)

      if (v.length > 0) {
        model.setActive(true)
        await model.search(v)

        setSuggestions(model.suggestions)
      } else {
        model.clear()

        setSuggestions(model.suggestions)
      }
    },
    [model, setValue],
  )

  const openSheet = React.useCallback(() => {
    sheet.current?.snapToIndex(0)
    input.current?.focus()
  }, [sheet])

  const onSheetChange = React.useCallback(
    async (index: number) => {
      if (index > -1) {
        model.setActive(true)
        await model.search('') // get default results
        setSuggestions(model.suggestions)
        setIsInitialLoad(false)
      }
    },
    [model, setSuggestions, setIsInitialLoad],
  )

  const onCloseSheet = React.useCallback(() => {
    reset()
    setIsInitialLoad(true)
    input.current?.blur()
  }, [reset, setIsInitialLoad])

  return (
    <View>
      <TagInputEntryButton onRequestOpen={openSheet} tags={tags} />

      <Portal>
        <BottomSheet
          ref={sheet}
          index={-1}
          snapPoints={['90%']}
          enablePanDownToClose
          keyboardBehavior="extend"
          backgroundStyle={{backgroundColor: 'transparent'}}
          android_keyboardInputMode="adjustResize"
          backdropComponent={props => (
            <BottomSheetBackdrop
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              {...props}
            />
          )}
          handleIndicatorStyle={{backgroundColor: pal.text.color}}
          handleStyle={{display: 'none'}}
          onChange={onSheetChange}
          onClose={onCloseSheet}>
          <Sheet.Outer>
            <Sheet.Handle />

            <Sheet.Content>
              <View style={styles.outer}>
                <FontAwesomeIcon
                  icon="tags"
                  size={14}
                  style={pal.textLight as FontAwesomeIconStyle}
                />

                {tags.map(tag => (
                  <TagButton key={tag} value={tag} onClick={removeTag} />
                ))}

                <TextInput
                  ref={input}
                  blurOnSubmit={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholder="Add tags..."
                  value={value}
                  style={[styles.input, {}]}
                  onChangeText={onChangeText}
                  onKeyPress={onKeyPress}
                  onSubmitEditing={onSubmitEditing}
                  accessibilityHint="Add tags to your post"
                  accessibilityLabel="Add tags to your post"
                />
              </View>

              <View style={{marginHorizontal: -20}}>
                <ScrollView horizontal>
                  <View style={styles.suggestions}>
                    {isInitialLoad && <ActivityIndicator />}

                    {suggestions
                      .filter(s => !tags.find(t => t === s))
                      .map(suggestion => {
                        return (
                          <TagButton
                            key={suggestion}
                            icon="plus"
                            value={suggestion}
                            onClick={addTagAndReset}
                          />
                        )
                      })}
                  </View>
                </ScrollView>
              </View>
            </Sheet.Content>
          </Sheet.Outer>
        </BottomSheet>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  outer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flexGrow: 1,
    minWidth: 100,
    fontSize: 15,
    lineHeight: Platform.select({
      web: 20,
      native: 18,
    }),
    paddingTop: 4,
    paddingBottom: 4,
  },
  suggestions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 20,
    paddingVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
})
