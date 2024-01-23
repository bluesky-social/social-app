import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {
  CONFIGURABLE_LABEL_GROUPS,
  ConfigurableLabelGroup,
  configurableLabelGroups,
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from 'state/queries/preferences'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {LabelPreference} from '@atproto/api'
import {isNative} from 'platform/detection'
import {Trans} from '@lingui/macro'
import {TextLink} from 'view/com/util/Link'
import {Divider} from '#/components/Divider'

export function StepModeration() {
  const t = useTheme()

  const {state, dispatch} = React.useContext(Context)

  return (
    // Hack for now to move the image container up
    <View style={[a.align_start]}>
      <Title>You have control</Title>
      <Description style={[a.mb_xl]}>
        Select the types of content that you want to see, and we'll handle the
        rest.
      </Description>

      {isNative && (
        <View style={[a.mb_xl]}>
          {/* TODO remove this line height when we can control it */}
          <Text style={[t.atoms.text_contrast_700, {lineHeight: 18}]}>
            <Trans>
              Adult content can only be enabled via the Web at{' '}
              <TextLink
                style={[{color: t.palette.primary_500}]}
                href="https://bsky.app"
                text="bsky.app"
              />
              .
            </Trans>
          </Text>
        </View>
      )}

      <View style={[a.gap_sm, a.w_full]}>
        {configurableLabelGroups.map((g, index) => (
          <React.Fragment key={index}>
            {index === 0 && <Divider />}
            <ModerationOption labelGroup={g} />
            <Divider />
          </React.Fragment>
        ))}
      </View>

      <OnboardingControls.Portal>
        <Button
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={() => dispatch({type: 'next'})}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}

function ModerationOption({labelGroup}: {labelGroup: ConfigurableLabelGroup}) {
  const t = useTheme()
  const groupInfo = CONFIGURABLE_LABEL_GROUPS[labelGroup]
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const visibility =
    variables?.visibility ?? preferences?.contentLabels?.[labelGroup]

  const onChange = React.useCallback(
    (vis: string[]) => {
      mutate({labelGroup, visibility: vis[0] as LabelPreference})
    },
    [mutate, labelGroup],
  )

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.gap_sm,
        a.py_xs,
        a.px_xs,
        a.align_center,
      ]}>
      <View style={[a.gap_xs, {width: '50%'}]}>
        <Text style={[a.font_bold]}>{groupInfo.title}</Text>
        <Text style={[t.atoms.text_contrast_700]}>{groupInfo.subtitle}</Text>
      </View>
      <View style={[a.justify_center, {minHeight: 35}]}>
        {isNative && groupInfo.isAdultImagery ? (
          <Text style={[a.font_bold]}>Hide</Text>
        ) : (
          <ToggleButton.Group
            label="Preferences"
            values={[visibility ?? 'hide']}
            onChange={onChange}>
            <ToggleButton.Button name="hide" label="Hide">
              Hide
            </ToggleButton.Button>
            <ToggleButton.Button name="warn" label="Warn">
              Warn
            </ToggleButton.Button>
            <ToggleButton.Button name="show" label="Show">
              Show
            </ToggleButton.Button>
          </ToggleButton.Group>
        )}
      </View>
    </View>
  )
}
