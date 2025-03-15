import {View} from 'react-native'
import Animated, {FadeInDown, FadeOut} from 'react-native-reanimated'
import {Trans} from '@lingui/macro'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function Autocomplete({
  prefix,
  onSelect,
}: {
  prefix: string
  onSelect: (item: string) => void
}) {
  const t = useTheme()

  const isActive = !!prefix
  const {data: suggestions, isFetching} = useActorAutocompleteQuery(
    prefix,
    true,
  )

  if (!isActive) return null

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOut.duration(100)}
      style={[
        t.atoms.bg,
        a.mt_sm,
        a.border,
        a.rounded_sm,
        t.atoms.border_contrast_high,
        {marginLeft: -62},
      ]}>
      {suggestions?.length ? (
        suggestions.slice(0, 5).map((item, index, arr) => {
          return (
            <View
              style={[
                index !== arr.length - 1 && a.border_b,
                t.atoms.border_contrast_high,
                a.px_sm,
                a.py_md,
              ]}
              key={item.did}>
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
                    style={[a.flex_1, a.text_md, a.font_bold]}
                    emoji
                    numberOfLines={1}>
                    {sanitizeDisplayName(
                      item.displayName || sanitizeHandle(item.handle),
                    )}
                  </Text>
                  <Text
                    style={[
                      t.atoms.text_contrast_medium,
                      a.text_right,
                      {maxWidth: '50%'},
                    ]}
                    numberOfLines={1}>
                    {sanitizeHandle(item.handle, '@')}
                  </Text>
                </View>
              </PressableScale>
            </View>
          )
        })
      ) : (
        <Text style={[a.text_md, a.px_sm, a.py_md]}>
          {isFetching ? <Trans>Loading...</Trans> : <Trans>No result</Trans>}
        </Text>
      )}
    </Animated.View>
  )
}
