import React from 'react'
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native'
import PasteInput, {
  PastedFile,
  PasteInputRef,
} from '@mattermost/react-native-paste-input'
import {AppBskyRichtextFacet, RichText} from '@atproto/api'
import isEqual from 'lodash.isequal'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {Autocomplete} from './mobile/Autocomplete'
import {Text} from 'view/com/util/text/Text'
import {useStores} from 'state/index'
import {cleanError} from 'lib/strings/errors'
import {getImageDim} from 'lib/media/manip'
import {cropAndCompressFlow} from 'lib/media/picker'
import {getMentionAt, insertMentionAt} from 'lib/strings/mention-manip'
import {
  POST_IMG_MAX_WIDTH,
  POST_IMG_MAX_HEIGHT,
  POST_IMG_MAX_SIZE,
} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'

export interface TextInputRef {
  focus: () => void
  blur: () => void
}

interface TextInputProps {
  richtext: RichText
  placeholder: string
  suggestedLinks: Set<string>
  autocompleteView: UserAutocompleteModel
  setRichText: (v: RichText) => void
  onPhotoPasted: (uri: string) => void
  onSuggestedLinksChanged: (uris: Set<string>) => void
  onError: (err: string) => void
}

interface Selection {
  start: number
  end: number
}

export const TextInput = React.forwardRef(
  (
    {
      richtext,
      placeholder,
      suggestedLinks,
      autocompleteView,
      setRichText,
      onPhotoPasted,
      onSuggestedLinksChanged,
      onError,
    }: TextInputProps,
    ref,
  ) => {
    const pal = usePalette('default')
    const store = useStores()
    const textInput = React.useRef<PasteInputRef>(null)
    const textInputSelection = React.useRef<Selection>({start: 0, end: 0})
    const theme = useTheme()

    React.useImperativeHandle(ref, () => ({
      focus: () => textInput.current?.focus(),
      blur: () => textInput.current?.blur(),
    }))

    React.useEffect(() => {
      // HACK
      // wait a moment before focusing the input to resolve some layout bugs with the keyboard-avoiding-view
      // -prf
      let to: NodeJS.Timeout | undefined
      if (textInput.current) {
        to = setTimeout(() => {
          textInput.current?.focus()
        }, 250)
      }
      return () => {
        if (to) {
          clearTimeout(to)
        }
      }
    }, [])

    const onChangeText = React.useCallback(
      (newText: string) => {
        const newRt = new RichText({text: newText})
        newRt.detectFacetsWithoutResolution()
        setRichText(newRt)

        const prefix = getMentionAt(
          newText,
          textInputSelection.current?.start || 0,
        )
        if (prefix) {
          autocompleteView.setActive(true)
          autocompleteView.setPrefix(prefix.value)
        } else {
          autocompleteView.setActive(false)
        }

        const set: Set<string> = new Set()
        if (newRt.facets) {
          for (const facet of newRt.facets) {
            for (const feature of facet.features) {
              if (AppBskyRichtextFacet.isLink(feature)) {
                set.add(feature.uri)
              }
            }
          }
        }
        if (!isEqual(set, suggestedLinks)) {
          onSuggestedLinksChanged(set)
        }
      },
      [setRichText, autocompleteView, suggestedLinks, onSuggestedLinksChanged],
    )

    const onPaste = React.useCallback(
      async (err: string | undefined, files: PastedFile[]) => {
        if (err) {
          return onError(cleanError(err))
        }
        const uris = files.map(f => f.uri)
        const imgUri = uris.find(uri => /\.(jpe?g|png)$/.test(uri))
        if (imgUri) {
          let imgDim
          try {
            imgDim = await getImageDim(imgUri)
          } catch (e) {
            imgDim = {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT}
          }
          const finalImgPath = await cropAndCompressFlow(
            store,
            imgUri,
            imgDim,
            {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
            POST_IMG_MAX_SIZE,
          )
          onPhotoPasted(finalImgPath)
        }
      },
      [store, onError, onPhotoPasted],
    )

    const onSelectionChange = React.useCallback(
      (evt: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
        // NOTE we track the input selection using a ref to avoid excessive renders -prf
        textInputSelection.current = evt.nativeEvent.selection
      },
      [textInputSelection],
    )

    const onSelectAutocompleteItem = React.useCallback(
      (item: string) => {
        onChangeText(
          insertMentionAt(
            richtext.text,
            textInputSelection.current?.start || 0,
            item,
          ),
        )
        autocompleteView.setActive(false)
      },
      [onChangeText, richtext, autocompleteView],
    )

    const textDecorated = React.useMemo(() => {
      let i = 0
      return Array.from(richtext.segments()).map(segment => {
        if (!segment.facet) {
          return (
            <Text key={i++} style={[pal.text, styles.textInputFormatting]}>
              {segment.text}
            </Text>
          )
        } else {
          return (
            <Text key={i++} style={[pal.link, styles.textInputFormatting]}>
              {segment.text}
            </Text>
          )
        }
      })
    }, [richtext, pal.link, pal.text])

    return (
      <View style={styles.container}>
        <PasteInput
          testID="composerTextInput"
          ref={textInput}
          onChangeText={onChangeText}
          onPaste={onPaste}
          onSelectionChange={onSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={pal.colors.textLight}
          keyboardAppearance={theme.colorScheme}
          multiline
          style={[pal.text, styles.textInput, styles.textInputFormatting]}>
          {textDecorated}
        </PasteInput>
        <Autocomplete
          view={autocompleteView}
          onSelect={onSelectAutocompleteItem}
        />
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    width: '100%',
    minHeight: 80,
    padding: 5,
    paddingBottom: 20,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  textInputFormatting: {
    fontSize: 18,
    letterSpacing: 0.2,
    fontWeight: '400',
    lineHeight: 23.4, // 1.3*16
  },
})
