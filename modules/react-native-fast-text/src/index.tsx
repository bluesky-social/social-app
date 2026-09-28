import {createContext, use} from 'react'
import {
  Platform,
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
  unstable_TextAncestorContext,
} from 'react-native'
import {
  unstable_mapTextProps as mapTextProps,
  unstable_NativePlainText as NativePlainText,
} from 'react-native-plain-text'
import {LinguiContext} from '@lingui/react'

import {NEEDS_TRANSLATION, resolveText, UNSUPPORTED} from './resolveText'
import {supportsProps, supportsStyle} from './supported'
import {type Options, type TextProps} from './types'

export type {TextProps} from './types'

/* UITextView and other custom fallbacks need the same protection as RN Text. */
const FallbackAncestor = createContext(false)

/**
 * Keeps an existing Text implementation for every case the native label cannot
 * represent. Create once at module scope, never during a component's render.
 */
export function createText<Props extends RNTextProps>(
  Fallback: React.ComponentType<Props>,
  options: Options<Props> = {},
) {
  const useText = createTextRenderer(Fallback, options)
  return function Text(props: TextProps<Props>) {
    return useText(props)
  }
}

/**
 * Hook adapter for existing design-system Text components. Returning its element
 * directly avoids adding a selector component/fiber on both fast and fallback
 * paths. Create the hook once at module scope and call it on every render.
 */
export function createTextRenderer<Props extends RNTextProps>(
  Fallback: React.ComponentType<Props>,
  {ignoredProps = [], needsAncestorGuard}: Options<Props> = {},
) {
  const ignored = new Set<string>(ignoredProps)

  return function useText(props: TextProps<Props>) {
    const {deopt, ...rest} = props

    /*
     * Release measurements favor RN's native renderer on Android. Lowering a
     * known descriptor still removes translation/fragment fibers, without the
     * extra native prop mapping or TextView measurement cost. RN retains all
     * prop, style, ancestry, and imperative-ref behavior on this path.
     */
    if (Platform.OS === 'android') {
      if (
        !deopt &&
        rest.children !== null &&
        typeof rest.children === 'object'
      ) {
        let text = resolveText(rest.children)
        if (text === NEEDS_TRANSLATION) {
          const lingui = use(LinguiContext)
          text = lingui ? resolveText(rest.children, lingui) : UNSUPPORTED
        }
        if (typeof text === 'string' && text.length > 0) {
          return <Fallback {...(rest as Props)}>{text}</Fallback>
        }
      }
      return <Fallback {...(rest as Props)} />
    }

    let text = UNSUPPORTED as ReturnType<typeof resolveText>
    let style: TextStyle | undefined
    if (!deopt && supportsProps(rest, ignored)) {
      style = StyleSheet.flatten(rest.style) as TextStyle | undefined
      if (supportsStyle(style)) {
        text = resolveText(rest.children)
        if (text === NEEDS_TRANSLATION) {
          // React 19 use() deliberately permits conditional context reads.
          const lingui = use(LinguiContext)
          text = lingui ? resolveText(rest.children, lingui) : UNSUPPORTED
        }
      }
    }

    // Preserve RN's distinction between an empty string and absent children.
    if (typeof text === 'string' && text.length > 0) {
      const customAncestor = use(FallbackAncestor)
      const nativeAncestor = use(unstable_TextAncestorContext)
      if (customAncestor || nativeAncestor) {
        return <Fallback {...(rest as Props)} />
      }
      const input: RNTextProps = {...rest, children: text, style}
      for (const key of ignored) delete (input as Record<string, unknown>)[key]

      const nativeProps = mapTextProps(input)
      return (
        <NativePlainText
          {...nativeProps}
          nativeID={rest.id ?? rest.nativeID}
          accessible={rest.accessible ?? Platform.OS === 'ios'}
          accessibilityLabel={rest.accessibilityLabel ?? text}
          accessibilityHint={rest.accessibilityHint}
          accessibilityRole={rest.accessibilityRole ?? 'text'}
          lineHeightClippingCompat
        />
      )
    }

    if (
      Fallback === RNText ||
      typeof rest.children !== 'object' ||
      needsAncestorGuard?.(rest as Props) === false
    ) {
      return <Fallback {...(rest as Props)} />
    }

    return (
      <FallbackAncestor value={true}>
        <Fallback {...(rest as Props)} />
      </FallbackAncestor>
    )
  }
}

/** A drop-in Text that lowers supported content to one native label. */
export const Text = createText(RNText)
