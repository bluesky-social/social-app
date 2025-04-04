import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Nux, useSaveNux} from '#/state/queries/nuxs'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useInterestsDisplayNames} from '#/screens/Onboarding/state'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

export function ExploreInterestsCard() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base'])
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
        title={_(msg`Your interests`)}
        description={_(
          msg`You can adjust your interests at any time from your "Content and media" settings.`,
        )}
        confirmButtonCta={_(
          msg({
            message: `Copy that!`,
            comment: `Confirm button text. Can be a short cheeky phrase that means "OK" e.g. "Copy that!"`,
          }),
        )}
        onConfirm={onConfirmClose}
      />

      <View style={[gutters, a.pt_lg, a.pb_2xs]}>
        <View
          style={[
            a.p_lg,
            a.rounded_md,
            a.border,
            a.gap_sm,
            t.atoms.border_contrast_medium,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[a.text_md, a.font_bold, a.leading_tight]}>
            <Trans>Your interests</Trans>
          </Text>

          {preferences?.interests?.tags &&
          preferences.interests.tags.length > 0 ? (
            <View style={[a.flex_row, a.flex_wrap, {gap: 6}]}>
              {preferences.interests.tags.map(tag => (
                <View
                  key={tag}
                  style={[
                    a.justify_center,
                    a.align_center,
                    a.rounded_full,
                    a.border,
                    t.atoms.border_contrast_medium,
                    a.px_lg,
                    {height: 32},
                  ]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {interestsDisplayNames[tag]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={[a.text_sm, a.leading_snug, a.pb_xs]}>
            <Trans>
              Your selected interests help us serve you content you care about.
            </Trans>
          </Text>

          <Link
            label={_(msg`Edit interests`)}
            to="/settings/interests"
            size="small"
            variant="solid"
            color="primary"
            style={[a.justify_center]}>
            <ButtonText>
              <Trans>Edit interests</Trans>
            </ButtonText>
          </Link>

          <Button
            label={_(msg`Hide this card`)}
            size="small"
            variant="solid"
            color="secondary"
            shape="round"
            onPress={onClose}
            style={[
              a.absolute,
              {top: a.pt_xs.paddingTop, right: a.pr_xs.paddingRight},
            ]}>
            <ButtonIcon icon={X} />
          </Button>
        </View>
      </View>
    </>
  )
}
