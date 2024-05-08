import React, {
  ComponentProps,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native'
import {AppBskyRichtextFacet, RichText} from '@atproto/api'
import PasteInput, {
  PastedFile,
  PasteInputRef,
} from '@mattermost/react-native-paste-input'

import {POST_IMG_MAX} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {downloadAndResize} from 'lib/media/manip'
import {isUriImage} from 'lib/media/util'
import {cleanError} from 'lib/strings/errors'
import {getMentionAt, insertMentionAt} from 'lib/strings/mention-manip'
import {useTheme} from 'lib/ThemeContext'
import {isIOS} from 'platform/detection'
import {
  LinkFacetMatch,
  suggestLinkCardUri,
} from 'view/com/composer/text-input/text-input-util'
import {Text} from 'view/com/util/text/Text'
import {Autocomplete} from './mobile/Autocomplete'

export interface TextInputRef {
  focus: () => void
  blur: () => void
  getCursorPosition: () => DOMRect | undefined
}

interface TextInputProps extends ComponentProps<typeof RNTextInput> {
  richtext: RichText
  placeholder: string
  setRichText: (v: RichText | ((v: RichText) => RichText)) => void
  onPhotoPasted: (uri: string) => void
  onPressPublish: (richtext: RichText) => Promise<void>
  onNewLink: (uri: string) => void
  onError: (err: string) => void
}

interface Selection {
  start: number
  end: number
}

export const TextInput = forwardRef(function TextInputImpl(
  {
    richtext,
    placeholder,
    setRichText,
    onPhotoPasted,
    onNewLink,
    onError,
    ...props
  }: TextInputProps,
  ref,
) {
  const pal = usePalette('default')
  const textInput = useRef<PasteInputRef>(null)
  const textInputSelection = useRef<Selection>({start: 0, end: 0})
  const theme = useTheme()
  const [autocompletePrefix, setAutocompletePrefix] = useState('')
  const prevLength = React.useRef(richtext.length)

  React.useImperativeHandle(ref, () => ({
    focus: () => textInput.current?.focus(),
    blur: () => {
      textInput.current?.blur()
    },
    getCursorPosition: () => undefined, // Not implemented on native
  }))

  const pastSuggestedUris = useRef(new Set<string>())
  const prevDetectedUris = useRef(new Map<string, LinkFacetMatch>())
  const onChangeText = useCallback(
    (newText: string) => {
      /*
       * This is a hack to bump the rendering of our styled
       * `textDecorated` to _after_ whatever processing is happening
       * within the `PasteInput` library. Without this, the elements in
       * `textDecorated` are not correctly painted to screen.
       *
       * NB: we tried a `0` timeout as well, but only positive values worked.
       *
       * @see https://github.com/bluesky-social/social-app/issues/929
       */
      setTimeout(async () => {
        const mayBePaste = newText.length > prevLength.current + 1

        const newRt = new RichText({text: newText})
        newRt.detectFacetsWithoutResolution()
        setRichText(newRt)

        const prefix = getMentionAt(
          newText,
          textInputSelection.current?.start || 0,
        )
        if (prefix) {
          setAutocompletePrefix(prefix.value)
        } else if (autocompletePrefix) {
          setAutocompletePrefix('')
        }

        const nextDetectedUris = new Map<string, LinkFacetMatch>()
        if (newRt.facets) {
          for (const facet of newRt.facets) {
            for (const feature of facet.features) {
              if (AppBskyRichtextFacet.isLink(feature)) {
                if (isUriImage(feature.uri)) {
                  const res = await downloadAndResize({
                    uri: feature.uri,
                    width: POST_IMG_MAX.width,
                    height: POST_IMG_MAX.height,
                    mode: 'contain',
                    maxSize: POST_IMG_MAX.size,
                    timeout: 15e3,
                  })

                  if (res !== undefined) {
                    onPhotoPasted(res.path)
                  }
                } else {
                  nextDetectedUris.set(feature.uri, {facet, rt: newRt})
                }
              }
            }
          }
        }
        const suggestedUri = suggestLinkCardUri(
          mayBePaste,
          nextDetectedUris,
          prevDetectedUris.current,
          pastSuggestedUris.current,
        )
        prevDetectedUris.current = nextDetectedUris
        if (suggestedUri) {
          onNewLink(suggestedUri)
        }
        prevLength.current = newText.length
      }, 1)
    },
    [setRichText, autocompletePrefix, onPhotoPasted, onNewLink],
  )

  const onPaste = useCallback(
    async (err: string | undefined, files: PastedFile[]) => {
      if (err) {
        return onError(cleanError(err))
      }

      const uris = files.map(f => f.uri)
      const uri = uris.find(isUriImage)

      if (uri) {
        onPhotoPasted(uri)
      }
    },
    [onError, onPhotoPasted],
  )

  const onSelectionChange = useCallback(
    (evt: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      // NOTE we track the input selection using a ref to avoid excessive renders -prf
      textInputSelection.current = evt.nativeEvent.selection
    },
    [textInputSelection],
  )

  const onSelectAutocompleteItem = useCallback(
    (item: string) => {
      onChangeText(
        insertMentionAt(
          richtext.text,
          textInputSelection.current?.start || 0,
          item,
        ),
      )
      setAutocompletePrefix('')
    },
    [onChangeText, richtext, setAutocompletePrefix],
  )

  const textDecorated = useMemo(() => {
    let i = 0

    return Array.from(richtext.segments()).map(segment => {
      return (
        <Text
          key={i++}
          style={[
            segment.facet ? pal.link : pal.text,
            styles.textInputFormatting,
          ]}>
          {segment.text}
        </Text>
      )
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
        autoFocus={true}
        allowFontScaling
        multiline
        scrollEnabled={false}
        numberOfLines={4}
        style={[
          pal.text,
          styles.textInput,
          styles.textInputFormatting,
          {textAlignVertical: 'top'},
        ]}
        {...props}>
        {textDecorated}
      </PasteInput>
      <Autocomplete
        prefix={autocompletePrefix}
        onSelect={onSelectAutocompleteItem}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    width: '100%',
    padding: 5,
    paddingBottom: 20,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  textInputFormatting: {
    fontSize: 18,
    letterSpacing: 0.2,
    fontWeight: '400',
    // This is broken on ios right now, so don't set it there.
    lineHeight: isIOS ? undefined : 23.4, // 1.3*16
  },
})
