import {useState} from 'react'
import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {utils} from '@bsky.app/alf'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInterestsDisplayNames} from '#/lib/interests'
import {Nux, useSaveNux} from '#/state/queries/nuxs'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Shapes_Stroke2_Corner0_Rounded as Shapes} from '#/components/icons/Shapes'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

export function ExploreInterestsCard() {
  const t = useTheme()
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const interestsDisplayNames = useInterestsDisplayNames()
  const {mutateAsync: saveNux} = useSaveNux()
  const trendingPrompt = Prompt.usePromptControl()
  const [closing, setClosing] = useState(false)

  const onClose = () => {
    trendingPrompt.open()
  }
  const onConfirmClose = () => {
    setClosing(true)
    // if this fails, they can try again later
    saveNux({
      id: Nux.ExploreInterestsCard,
      completed: true,
      data: undefined,
    }).catch(() => {})
  }

  return closing ? null : (
    <>
      <Prompt.Basic
        control={trendingPrompt}
        title={_(msg`Dismiss interests`)}
        description={_(
          msg`You can adjust your interests at any time from "Content and media" settings.`,
        )}
        confirmButtonCta={_(
          msg({
            message: `OK`,
            comment: `Confirm button text.`,
          }),
        )}
        onConfirm={onConfirmClose}
      />

      <View style={[a.pb_2xs]}>
        <View style={[a.p_lg, a.gap_md]}>
          <View style={[a.flex_row, a.gap_sm, a.align_center]}>
            <Shapes />
            <Text style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
              <Trans>Your interests</Trans>
            </Text>
          </View>

          {preferences?.interests?.tags &&
          preferences.interests.tags.length > 0 ? (
            <View style={[a.flex_row, a.w_full, a.gap_xs]}>
              <View style={[a.flex_1, a.flex_row, a.overflow_hidden, {gap: 6}]}>
                {preferences.interests.tags.map(tag => (
                  <View
                    key={tag}
                    style={[
                      a.justify_center,
                      a.align_center,
                      a.rounded_full,
                      t.atoms.bg_contrast_25,
                      a.px_lg,
                      {height: 32},
                    ]}>
                    <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                      {interestsDisplayNames[tag]}
                    </Text>
                  </View>
                ))}
                <LinearGradient
                  key={t.name} // android does not update when you change the colors. sigh.
                  start={[0, 0.5]}
                  end={[1, 0.5]}
                  colors={[
                    utils.alpha(t.atoms.bg.backgroundColor, 0),
                    t.atoms.bg.backgroundColor,
                  ]}
                  style={[
                    a.absolute,
                    a.top_0,
                    a.right_0,
                    a.bottom_0,
                    {width: 30},
                  ]}
                />
              </View>
              <View style={[a.h_full, t.atoms.bg]}>
                <Link
                  label={_(msg`Edit interests`)}
                  to="/settings/interests"
                  size="small"
                  color="primary_subtle"
                  style={[a.justify_center]}>
                  <ButtonText>
                    <Trans>Edit</Trans>
                  </ButtonText>
                </Link>
              </View>
            </View>
          ) : (
            <Link
              label={_(msg`Add interests`)}
              to="/settings/interests"
              size="small"
              color="primary"
              style={[a.justify_center]}>
              <ButtonText>
                <Trans>Add interests</Trans>
              </ButtonText>
            </Link>
          )}

          <Text style={[a.text_sm, a.leading_snug]}>
            <Trans>Your interests help us find what you like!</Trans>
          </Text>

          <Button
            label={_(msg`Hide this card`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={onClose}
            style={[
              a.absolute,
              {top: a.pt_sm.paddingTop, right: a.pr_sm.paddingRight},
            ]}>
            <ButtonIcon icon={X} size="md" />
          </Button>
        </View>
      </View>
    </>
  )
}
