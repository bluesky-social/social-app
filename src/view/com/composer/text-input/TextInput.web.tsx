import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {StyleSheet, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {RichText} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {atoms as a, useAlf, useTheme} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'
import {type TextInputProps, type TextInputRef} from './TextInput.types'
import {getImageOrVideoFromUri} from './web/uri-to-media'

const RichTextInput = lazy(() => import('./web/RichTextInputWeb'))

export function TextInput(props: TextInputProps) {
  const {hasRightPadding, isActive, onPhotoPasted, onPressPublish} = props

  const t = useTheme()

  const [isDropping, setIsDropping] = useState(false)

  useEffect(() => {
    if (!isActive) {
      return
    }
    textInputWebEmitter.addListener('publish', onPressPublish)
    return () => {
      textInputWebEmitter.removeListener('publish', onPressPublish)
    }
  }, [onPressPublish, isActive])

  useEffect(() => {
    if (!isActive) {
      return
    }
    textInputWebEmitter.addListener('media-pasted', onPhotoPasted)
    return () => {
      textInputWebEmitter.removeListener('media-pasted', onPhotoPasted)
    }
  }, [isActive, onPhotoPasted])

  useEffect(() => {
    if (!isActive) {
      return
    }

    const handleDrop = (event: DragEvent) => {
      const transfer = event.dataTransfer
      if (transfer) {
        const items = transfer.items

        getImageOrVideoFromUri(items, (uri: string) => {
          textInputWebEmitter.emit('media-pasted', uri)
        })
      }

      event.preventDefault()
      setIsDropping(false)
    }
    const handleDragEnter = (event: DragEvent) => {
      const transfer = event.dataTransfer

      event.preventDefault()
      if (transfer && transfer.types.includes('Files')) {
        setIsDropping(true)
      }
    }
    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      setIsDropping(false)
    }

    document.body.addEventListener('drop', handleDrop)
    document.body.addEventListener('dragenter', handleDragEnter)
    document.body.addEventListener('dragover', handleDragEnter)
    document.body.addEventListener('dragleave', handleDragLeave)

    return () => {
      document.body.removeEventListener('drop', handleDrop)
      document.body.removeEventListener('dragenter', handleDragEnter)
      document.body.removeEventListener('dragover', handleDragEnter)
      document.body.removeEventListener('dragleave', handleDragLeave)
    }
  }, [setIsDropping, isActive])

  return (
    <>
      <View style={[styles.container, hasRightPadding && styles.rightPadding]}>
        <Suspense fallback={<FallbackTextInput {...props} />}>
          <RichTextInput {...props} />
        </Suspense>
      </View>

      {isDropping && (
        <Portal>
          <Animated.View
            style={styles.dropContainer}
            entering={FadeIn.duration(80)}
            exiting={FadeOut.duration(80)}>
            <View
              style={[
                t.atoms.bg,
                t.atoms.border_contrast_low,
                styles.dropModal,
              ]}>
              <Text
                style={[
                  a.text_lg,
                  a.font_semi_bold,
                  t.atoms.text_contrast_medium,
                  t.atoms.border_contrast_high,
                  styles.dropText,
                ]}>
                <Trans>Drop to add images</Trans>
              </Text>
            </View>
          </Animated.View>
        </Portal>
      )}
    </>
  )
}

function FallbackTextInput({
  ref,
  richtext,
  placeholder,
  webForceMinHeight,
  setRichText,
  onFocus,
}: Pick<
  TextInputProps,
  | 'ref'
  | 'richtext'
  | 'placeholder'
  | 'webForceMinHeight'
  | 'setRichText'
  | 'onFocus'
>) {
  const {theme: t, fonts} = useAlf()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      const newRt = new RichText({text: newText})
      newRt.detectFacetsWithoutResolution()
      setRichText(newRt)
    },
    [setRichText],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      textInputWebEmitter.emit('publish')
      e.preventDefault()
    }
  }, [])

  useImperativeHandle(
    ref,
    (): TextInputRef => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      getCursorPosition: () => undefined,
      maybeClosePopup: () => false,
    }),
  )

  useEffect(() => {
    // Move cursor to end after autofocus
    const textarea = textareaRef.current
    if (textarea) {
      const len = textarea.value.length
      textarea.setSelectionRange(len, len)
    }
  }, [])

  const inputStyle = useMemo((): React.CSSProperties => {
    const style = normalizeTextStyles(
      [a.text_lg, a.leading_snug, t.atoms.text],
      {
        fontScale: fonts.scaleMultiplier,
        fontFamily: fonts.family,
        flags: {},
      },
    )
    style.lineHeight = style.lineHeight
      ? ((style.lineHeight + 'px') as unknown as number)
      : undefined
    style.minHeight = webForceMinHeight ? 140 : undefined
    return {
      ...style,
      width: '100%',
      border: 'none',
      outline: 'none',
      resize: 'none',
      background: 'transparent',
      padding: 0,
      margin: 0,
    } as React.CSSProperties
  }, [t, fonts, webForceMinHeight])

  return (
    <textarea
      ref={textareaRef}
      className="composer-fallback-input"
      autoFocus
      value={richtext.text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      placeholder={placeholder}
      style={inputStyle}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: 8,
    marginBottom: 10,
  },
  rightPadding: {
    paddingRight: 32,
  },
  dropContainer: {
    backgroundColor: '#0007',
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore web only -prf
    position: 'fixed',
    padding: 16,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  dropModal: {
    // @ts-ignore web only
    boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
    padding: 8,
    borderWidth: 1,
    borderRadius: 16,
  },
  dropText: {
    paddingVertical: 44,
    paddingHorizontal: 36,
    borderStyle: 'dashed',
    borderRadius: 8,
    borderWidth: 2,
  },
})
