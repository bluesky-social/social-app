import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type ViewStyleProp} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotate'
import {refetchConfig} from '#/ageAssurance/data'

export function AgeAssuranceConfigUnavailableError(props: ViewStyleProp) {
  const {_} = useLingui()
  return (
    <Admonition.Outer type="error" style={props.style}>
      <Admonition.Row>
        <Admonition.Icon />
        <Admonition.Content>
          <Admonition.Text>
            <Trans>
              We were unable to load the age assurance configuration for your
              region, probably due to a network error. Some content and features
              may be unavailable temporarily. Please try again later.
            </Trans>
          </Admonition.Text>
        </Admonition.Content>
        <Admonition.Button
          color="negative_subtle"
          label={_(msg`Retry`)}
          onPress={() => refetchConfig().catch(() => {})}>
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
          <ButtonIcon icon={RetryIcon} />
        </Admonition.Button>
      </Admonition.Row>
    </Admonition.Outer>
  )
}
