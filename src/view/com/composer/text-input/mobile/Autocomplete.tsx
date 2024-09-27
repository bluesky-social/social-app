import React, {useEffect, useRef} from 'react'
import {Animated, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {usePalette} from '#/lib/hooks/usePalette'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useGrapheme} from '../hooks/useGrapheme'

export function Autocomplete({
  prefix,
  onSelect,
}: {
  prefix: string
  onSelect: (item: string) => void
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const positionInterp = useAnimatedValue(0)
  const {getGraphemeString} = useGrapheme()
  const isActive = !!prefix
  const {data: suggestions, isFetching} = useActorAutocompleteQuery(prefix)
  const suggestionsRef = useRef<
    AppBskyActorDefs.ProfileViewBasic[] | undefined
  >(undefined)
  if (suggestions) {
    suggestionsRef.current = suggestions
  }

  useEffect(() => {
    Animated.timing(positionInterp, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [positionInterp, isActive])

  const topAnimStyle = {
    transform: [
      {
        translateY: positionInterp.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0],
        }),
      },
    ],
  }

  return (
    <Animated.View style={topAnimStyle}>
      {isActive ? (
        <View
          style={[
            pal.view,
            a.mt_sm,
            a.border,
            a.rounded_sm,
            t.atoms.border_contrast_high,
            {marginLeft: -62},
          ]}>
          {suggestionsRef.current?.length ? (
            suggestionsRef.current.slice(0, 5).map((item, index, arr) => {
              // Eventually use an average length
              const MAX_CHARS = 40
              const MAX_HANDLE_CHARS = 20

              // Using this approach because styling is not respecting
              // bounding box wrapping (before converting to ellipsis)
              const {name: displayHandle, remainingCharacters} =
                getGraphemeString(item.handle, MAX_HANDLE_CHARS)

              const {name: displayName} = getGraphemeString(
                item.displayName || item.handle,
                MAX_CHARS -
                  MAX_HANDLE_CHARS +
                  (remainingCharacters > 0 ? remainingCharacters : 0),
              )

              return (
                <View
                  style={[
                    index !== arr.length - 1 && a.border_b,
                    t.atoms.border_contrast_high,
                    a.px_sm,
                    a.py_md,
                  ]}
                  key={item.handle}>
                  <PressableScale
                    testID="autocompleteButton"
                    style={[
                      a.flex_row,
                      a.gap_sm,
                      a.justify_between,
                      a.align_center,
                    ]}
                    onPress={() => onSelect(item.handle)}
                    accessibilityLabel={`Select ${item.handle}`}
                    accessibilityHint="">
                    <View style={[a.flex_row, a.gap_sm, a.align_center]}>
                      <UserAvatar
                        avatar={item.avatar ?? null}
                        size={24}
                        type={item.associated?.labeler ? 'labeler' : 'user'}
                      />
                      <Text
                        style={[a.text_md, a.font_bold]}
                        emoji={true}
                        numberOfLines={1}>
                        {sanitizeDisplayName(displayName)}
                      </Text>
                    </View>
                    <Text
                      style={[t.atoms.text_contrast_medium]}
                      numberOfLines={1}>
                      {sanitizeHandle(displayHandle, '@')}
                    </Text>
                  </PressableScale>
                </View>
              )
            })
          ) : (
            <Text style={[a.text_md, a.px_sm, a.py_md]}>
              {isFetching ? (
                <Trans>Loading...</Trans>
              ) : (
                <Trans>No result</Trans>
              )}
            </Text>
          )}
        </View>
      ) : null}
    </Animated.View>
  )
}
