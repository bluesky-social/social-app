import {View} from 'react-native'
import Animated, {FadeInDown, FadeOut} from 'react-native-reanimated'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, platform, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'

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
            <AutocompleteProfileCard
              key={item.did}
              profile={item}
              itemIndex={index}
              totalItems={arr.length}
              onPress={() => {
                onSelect(item.handle)
              }}
            />
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

function AutocompleteProfileCard({
  profile,
  itemIndex,
  totalItems,
  onPress,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  itemIndex: number
  totalItems: number
  onPress: () => void
}) {
  const t = useTheme()
  const state = useSimpleVerificationState({profile})
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
  )
  return (
    <View
      style={[
        itemIndex !== totalItems - 1 && a.border_b,
        t.atoms.border_contrast_high,
        a.px_sm,
        a.py_md,
      ]}
      key={profile.did}>
      <PressableScale
        testID="autocompleteButton"
        style={[a.flex_row, a.gap_lg, a.justify_between, a.align_center]}
        onPress={onPress}
        accessibilityLabel={`Select ${profile.handle}`}
        accessibilityHint="">
        <View style={[a.flex_row, a.gap_sm, a.align_center, a.flex_1]}>
          <UserAvatar
            avatar={profile.avatar ?? null}
            size={24}
            type={profile.associated?.labeler ? 'labeler' : 'user'}
          />
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_xs,
              platform({ios: a.flex_1}),
            ]}>
            <Text
              style={[a.text_md, a.font_bold, a.leading_snug]}
              emoji
              numberOfLines={1}>
              {displayName}
            </Text>
            {state.isVerified && (
              <View
                style={[
                  {
                    marginTop: platform({android: -2}),
                  },
                ]}>
                <VerificationCheck
                  width={12}
                  verifier={state.role === 'verifier'}
                />
              </View>
            )}
          </View>
        </View>
        <Text
          style={[t.atoms.text_contrast_medium, a.text_right, a.leading_snug]}
          numberOfLines={1}>
          {sanitizeHandle(profile.handle, '@')}
        </Text>
      </PressableScale>
    </View>
  )
}
