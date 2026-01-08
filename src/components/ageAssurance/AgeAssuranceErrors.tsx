import {Trans} from '@lingui/macro'

import {type ViewStyleProp} from '#/alf'
import {Admonition} from '#/components/Admonition'

export function AgeAssuranceConfigUnavailableError(props: ViewStyleProp) {
  return (
    <Admonition type="error" style={props.style}>
      <Trans>
        We were unable to load age assurance configuration for your region,
        probably due to a network error. Some content and features may be
        unavailable temporarily. Please try again later.
      </Trans>
    </Admonition>
  )
}
