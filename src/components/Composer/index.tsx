import {useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {
  type TextInput,
  type TextInputSubmitEditingEvent,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSift, type UseSiftReturn} from '@bsky.app/sift'
import {
  facets,
  type TapperActiveFacet,
  type TapperFacet,
  useTapper,
} from '@bsky.app/tapper'

import {mergeRefs} from '#/lib/merge-refs'
import {
  atoms as a,
  type TextStyleProp,
  useAlf,
  type ViewStyleProp,
  web,
} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'
import {
  Autocomplete as AutocompleteBase,
  AutocompleteItemEmoji,
  AutocompleteItemProfile,
  parseAutocompleteItemType,
  useAutocomplete,
} from '#/components/Autocomplete'
import {
  AutosizedTextarea,
  type AutosizedTextareaProps,
} from '#/components/forms/AutosizedTextarea'
import {Span, Text} from '#/components/Typography'
import {IS_IOS, IS_WEB, IS_WEB_TOUCH_DEVICE} from '#/env'

export type SubmitRequest =
  | {
      platform: 'web'
      shiftKey: boolean
      metaKey: boolean
      nativeEvent: KeyboardEvent
    }
  | {
      platform: 'native'
      nativeEvent: TextInputSubmitEditingEvent
    }

/**
 * Imperative API exposed via `internalApiRef` prop for parent components that
 * need to control the composer programmatically, e.g. to clear the input or
 * insert text at the current cursor position.
 */
export type ComposerInternalApi = {
  input?: ReturnType<typeof useTapper>['input']
  clear: () => void
  insert(text: string): void
  setAutocompleteAnchor: (node: View | null) => void
}

export function useComposerInternalApiRef() {
  return useRef<ComposerInternalApi>(null)
}

/*
 * ─── Composer ─────────────────────────────────────────────────────────────────
 */

export type ComposerProps = Omit<
  AutosizedTextareaProps,
  | 'value'
  | 'onChange'
  | 'onChangeText'
  | 'onSelectionChange'
  | 'selection'
  | 'style'
  | 'onSubmitEditing'
> & {
  label: string
  ref?: React.RefObject<TextInput>
  internalApiRef?: React.Ref<ComposerInternalApi>
  outerStyle?: ViewStyleProp['style']
  contentTextStyle?: TextStyleProp['style']
  contentPaddingStyle?: {
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
  }
  onChange?: (text: string) => void
  onActiveFacet?: (activeFacet: TapperActiveFacet | null) => void
  onFacetCommitted?: (facet: TapperFacet) => void
  onRequestSubmit?: (request: SubmitRequest) => void
  autocompletePlacement?: Exclude<
    Parameters<typeof useSift>[0],
    undefined
  >['placement']
  disableEmojiFacets?: boolean
}

export function Composer({
  label,
  ref,
  internalApiRef,
  outerStyle,
  contentTextStyle,
  contentPaddingStyle,
  onChange: onChangeOuter,
  onActiveFacet: onActiveFacetOuter,
  onFacetCommitted: onFacetCommittedOuter,
  onRequestSubmit,
  autocompletePlacement,
  defaultValue,
  disableEmojiFacets = !IS_WEB,
  ...rest
}: ComposerProps) {
  const {theme: t, fonts} = useAlf()

  /*
   * Meat and potatoes
   */
  const tapper = useTapper({
    initialText: defaultValue ?? '',
    facets: disableEmojiFacets
      ? {
          mention: facets.mention,
          tag: facets.tag,
          url: facets.url,
        }
      : facets,
  })
  const sift = useSift({
    offset: a.p_sm.padding,
    placement: autocompletePlacement,
    dynamicWidth: IS_WEB,
  })

  /*
   * Active facet state for controlling the visibility of the Autocomplete.
   */
  const [activeFacet, setActiveFacet] = useState<TapperActiveFacet | null>(null)

  /*
   * Reanimated shared value for syncing scroll on all platforms.
   */
  const inputScrollSharedValue = useSharedValue(0)

  /*
   * Expose imperative internal API
   */
  useImperativeHandle(
    internalApiRef,
    () => ({
      input: tapper.input,
      clear: () => {
        tapper.inputProps.onChangeText('')
        inputScrollSharedValue.value = 0
      },
      insert: tapper.insert,
      setAutocompleteAnchor: sift.refs.setAnchor,
    }),
    [tapper.input, tapper.insert, inputScrollSharedValue, sift.refs.setAnchor],
  )

  /*
   * Skip the initial mount to avoid an unnecessary re-render — the parent
   * already knows the initial value since it passed `initialText`.
   */
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChangeOuter?.(tapper.state.text)
  }, [tapper.state.text, onChangeOuter])

  /*
   * Tapper callbacks
   */
  const callbackRefs = useRef({
    onActiveFacetOuter,
    onFacetCommittedOuter,
  })
  callbackRefs.current = {
    onActiveFacetOuter,
    onFacetCommittedOuter,
  }
  useEffect(() => {
    const offActiveFacet = tapper.on('activeFacet', facet => {
      setActiveFacet(facet)
      callbackRefs.current.onActiveFacetOuter?.(facet)
    })
    const offFacetCommitted = tapper.on('facetCommitted', facet => {
      callbackRefs.current.onFacetCommittedOuter?.(facet)
    })
    const offAfterInsert = tapper.on('afterInsert', () => {
      tapper.input.focus()
    })
    return () => {
      offActiveFacet()
      offFacetCommitted()
      offAfterInsert()
    }
  }, [tapper.on, tapper.input])

  /*
   * Styles
   */
  const previewScrollStyle = useAnimatedStyle(() => ({
    transform: [{translateY: -inputScrollSharedValue.value}],
  }))
  const textStyle = useMemo(() => {
    const ts = normalizeTextStyles(
      [a.leading_snug, t.atoms.text, contentTextStyle],
      {
        fontScale: fonts.scaleMultiplier,
        fontFamily: fonts.family,
        flags: {},
      },
    )
    /**
     * On iOS, having a lineHeight on the Text component causes the text to be
     * vertically misaligned with the TextInput.
     *
     * This only seems to be an issue on iOS, and not on Android or web. It's
     * possible that this is a bug in React Native's Text component on iOS,
     * but in the meantime, we'll just remove the lineHeight on iOS to ensure
     * the text is properly aligned.
     */
    if (IS_IOS) {
      delete ts.lineHeight
    }
    return ts
  }, [contentTextStyle, fonts])

  /*
   * Web keyboard handling
   */
  const isComposing = useRef(false)
  const onKeyPressWeb = (e: React.KeyboardEvent | any) => {
    if (IS_WEB_TOUCH_DEVICE) return
    if (isComposing.current) return

    /*
     * On Safari, the final keydown to dismiss an IME is also "Enter" with
     * keyCode 229. Chrome/Firefox don't have this problem.
     *
     * @see https://github.com/bluesky-social/social-app/issues/4178
     */
    if (e.key === 'Enter' && e.keyCode === 229) return

    if (e.key === 'Enter') {
      onRequestSubmit?.({
        platform: 'web',
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        nativeEvent: e.nativeEvent,
      })
    }
  }

  /*
   * Sift popover positioning
   */
  const updateAutocompletePosition = () => {
    sift.updatePosition()
  }

  const textContent = (
    <Text style={[textStyle, web({whiteSpace: 'pre-wrap'})]}>
      {tapper.state.nodes.map((node, i) => {
        switch (node.type) {
          case 'text':
            return <Span key={i}>{node.value}</Span>
          case 'trigger':
          case 'facet':
            return (
              <Span
                key={i}
                ref={IS_WEB ? sift.refs.setAnchor : undefined}
                style={
                  node.type === 'facet' && {
                    color: t.palette.primary_500,
                  }
                }>
                {node.raw}
              </Span>
            )
        }
      })}
    </Text>
  )

  return (
    <>
      <View style={[a.relative, outerStyle]}>
        {IS_WEB && (
          <View
            pointerEvents="none"
            style={[a.absolute, a.inset_0, a.z_10, {overflow: 'hidden'}]}
            ref={node => {
              if (IS_WEB && node) {
                // @ts-ignore web only a11y
                node.setAttribute('inert', '')
              }
            }}>
            <Animated.View
              style={[
                contentPaddingStyle,
                {position: 'absolute', left: 0, right: 0},
                previewScrollStyle,
              ]}>
              {textContent}
            </Animated.View>
          </View>
        )}
        <AutosizedTextarea
          placeholderTextColor={t.palette.contrast_500}
          accessibilityLabel={label}
          accessibilityHint={label}
          onSubmitEditing={e => {
            onRequestSubmit?.({platform: 'native', nativeEvent: e})
          }}
          style={[
            textStyle,
            contentPaddingStyle,
            a.z_20,
            {
              color: 'transparent',
              background: 'transparent',
            },
            web({
              caretColor: textStyle.color ?? 'black',
              overscrollBehavior: 'none',
              scrollbarWidth: 'thin',
              scrollbarColor: `${t.palette.contrast_200} transparent`,
            }),
          ]}
          {...rest}
          {...tapper.inputProps}
          {...sift.targetProps}
          ref={mergeRefs([ref, tapper.inputProps.ref, sift.targetProps.ref])}
          onBlur={e => {
            rest.onBlur?.(e)
            setActiveFacet(null)
          }}
          onKeyPress={IS_WEB ? onKeyPressWeb : undefined}
          onScroll={e => {
            if (IS_WEB) {
              inputScrollSharedValue.value = (e.target as any).scrollTop
            } else {
              inputScrollSharedValue.value = e.nativeEvent.contentOffset.y
            }
          }}
          // @ts-ignore web only
          onCompositionStart={() => {
            isComposing.current = true
          }}
          // @ts-ignore web only
          onCompositionEnd={() => {
            isComposing.current = false
          }}
          onUpdateHeight={updateAutocompletePosition}>
          {IS_WEB ? null : textContent}
        </AutosizedTextarea>
      </View>

      {activeFacet && activeFacet.type !== 'url' && (
        <AutocompleteInner
          inverted={autocompletePlacement?.startsWith('top')}
          sift={sift}
          activeFacet={activeFacet}
          onDismiss={() => setActiveFacet(null)}
        />
      )}
    </>
  )
}

/*
 * ─── Autocomplete (private) ───────────────────────────────────────────────────
 */

function AutocompleteInner({
  inverted,
  sift,
  activeFacet,
  onDismiss,
}: {
  inverted?: boolean
  sift: UseSiftReturn
  activeFacet: TapperActiveFacet
  onDismiss: () => void
}) {
  const {items} = useAutocomplete({
    type: parseAutocompleteItemType(activeFacet.type),
    query: activeFacet.value,
  })

  useEffect(() => {
    if (
      activeFacet?.type === 'emoji' &&
      !!activeFacet.value.length &&
      activeFacet.raw.endsWith(':')
    ) {
      if (items?.[0]) {
        activeFacet.replace(items[0].value, {noTrailingSpace: true})
        onDismiss()
      }
    }
  }, [items, activeFacet])

  return items && items.length ? (
    <AutocompleteBase
      inverted={inverted}
      sift={sift}
      data={items}
      render={props => {
        if (props.item.type === 'profile') {
          return <AutocompleteItemProfile {...props} />
        }
        if (props.item.type === 'emoji') {
          return <AutocompleteItemEmoji {...props} />
        }
        return <View />
      }}
      onSelect={item => {
        activeFacet.replace(item.value)
        onDismiss()
      }}
      onDismiss={onDismiss}
    />
  ) : null
}
