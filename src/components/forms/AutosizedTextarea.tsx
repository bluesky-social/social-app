import {useEffect, useMemo, useRef, useState} from 'react'
import {
  TextInput,
  type TextInputContentSizeChangeEvent,
  type TextInputProps,
} from 'react-native'

import {mergeRefs} from '#/lib/merge-refs'
import {atoms as a, extractPadding, useAlf, web} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'
import {IS_ANDROID, IS_IOS, IS_NATIVE, IS_WEB} from '#/env'

export type AutosizedTextareaProps = Omit<TextInputProps, 'multiline'> & {
  ref?: React.Ref<React.ComponentRef<typeof TextInput>>
  label: string
  minRows?: number
  maxRows?: number
  onUpdateHeight?: (height: number) => void
  /**
   * In some cases, like on native, we may not pass in an actual `value` prop.
   * This prop allows native platforms to know if the field was cleared and
   * thereby reset its height. This is a small hack required because Android's
   * height is driven by state, while iOS needs an explicit minimum height when
   * cleared programmatically.
   *
   * If you notice height calculation issues after clearing the field on a
   * native platform, check if this value is being populated and cleared
   * properly in the parent component.
   */
  rawValue?: string
}

export function AutosizedTextarea({
  ref,
  label,
  minRows = 1,
  maxRows,
  onUpdateHeight,
  rawValue,

  onChangeText: onChangeTextOuter,
  onContentSizeChange: onContentSizeChangeOuter,
  style: outerStyle,
  ...rest
}: AutosizedTextareaProps) {
  const {theme: t, fonts} = useAlf()
  const internalRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const {style, minInputHeight, maxInputHeight, verticalContentPadding} =
    useMemo(() => {
      const normalizedStyles = normalizeTextStyles(
        [a.text_md, a.leading_snug, t.atoms.text, outerStyle],
        {
          fontScale: fonts.scaleMultiplier,
          fontFamily: fonts.family,
          flags: {},
        },
      )
      const lineHeight = normalizedStyles.lineHeight || 20
      const {paddingTop, paddingBottom} = extractPadding(normalizedStyles ?? {})
      const verticalContentPadding = paddingTop + paddingBottom
      const minInputHeight = lineHeight * minRows + verticalContentPadding
      const maxInputHeight = maxRows
        ? lineHeight * maxRows + verticalContentPadding
        : Infinity

      /*
       * iOS: minHeight/maxHeight works fine natively.
       * Web + Android: we set an explicit initial height and resize dynamically
       * (web via DOM measurement, Android via onContentSizeChange state).
       *
       * iOS also seems to need 1px headroom to actually expand to the correct
       * maxHeight
       */
      const heightConstraints = IS_IOS
        ? {minHeight: minInputHeight, maxHeight: maxInputHeight + 1}
        : {height: minInputHeight}

      return {
        style: {
          ...normalizedStyles,
          ...heightConstraints,
        },
        minInputHeight,
        maxInputHeight,
        verticalContentPadding,
      }
    }, [t, fonts, outerStyle, minRows, maxRows])

  /*
   * Web handling
   */
  const prevWebHeight = useRef(0)
  const handleResizeWeb = () => {
    const el = internalRef.current as unknown as HTMLTextAreaElement
    if (!el) return
    // collapse to get natural scroll height
    el.style.height = '0px'
    const scrollHeight = Math.ceil(el.scrollHeight)
    const nextHeight = Math.min(
      Math.max(scrollHeight, minInputHeight),
      maxInputHeight,
    )
    // immediately update height to prevent flicker
    el.style.height = `${nextHeight}px`
    el.style.overflowY = scrollHeight > maxInputHeight ? 'auto' : 'hidden'
    if (nextHeight !== prevWebHeight.current) {
      prevWebHeight.current = nextHeight
      onUpdateHeight?.(nextHeight)
    }
  }
  const onChangeText = (text: string) => {
    if (IS_WEB) handleResizeWeb()
    onChangeTextOuter?.(text)
  }

  /*
   * Native handling
   *
   * We track the height as state on native, and on Android, we use this to
   * directly drive the `height`.
   */
  const [nativeHeight, setNativeHeight] = useState(minInputHeight)
  const onContentSizeChange = (e: TextInputContentSizeChangeEvent) => {
    const contentSize = Math.ceil(e.nativeEvent.contentSize.height)
    // ios reports the content size without padding
    const height = IS_IOS ? contentSize + verticalContentPadding : contentSize
    const nextHeight = Math.min(
      Math.max(height, minInputHeight),
      maxInputHeight,
    )

    if (nextHeight !== nativeHeight) {
      setNativeHeight(nextHeight)
      onUpdateHeight?.(nextHeight)
    }

    onContentSizeChangeOuter?.(e)
  }

  /*
   * Reset native height state after a programmatic clear. Android uses it as
   * the explicit input height, while iOS uses it to decide when to scroll.
   */
  const prevRawValue = useRef(rawValue || '')
  useEffect(() => {
    if (!IS_NATIVE) return
    if (rawValue === undefined) return // uncontrolled
    if (prevRawValue.current?.length && rawValue === '') {
      setNativeHeight(minInputHeight)
      onUpdateHeight?.(minInputHeight)
    }
    prevRawValue.current = rawValue
  }, [rawValue, minInputHeight])

  return (
    <TextInput
      multiline
      placeholderTextColor={t.palette.contrast_500}
      accessibilityLabel={label}
      accessibilityHint={label}
      placeholder={label}
      keyboardAppearance={t.scheme}
      submitBehavior="newline"
      scrollEnabled={nativeHeight >= maxInputHeight}
      style={[
        a.relative,
        a.border_0,
        {
          textAlignVertical: 'top',
          includeFontPadding: false,
        },
        web({
          resize: 'none',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }),
        style,
        IS_ANDROID && {height: nativeHeight},
        IS_IOS && rawValue === '' && {height: minInputHeight},
      ]}
      {...rest}
      ref={mergeRefs([
        (node: React.ComponentRef<typeof TextInput> | null) => {
          internalRef.current = node
          // bop resize on first render
          if (IS_WEB && node) handleResizeWeb()
        },
        ref,
      ])}
      onChangeText={onChangeText}
      onContentSizeChange={onContentSizeChange}
    />
  )
}
