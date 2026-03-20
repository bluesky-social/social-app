import {useLingui} from '@lingui/react/macro'

import {urls} from '#/lib/constants'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {RedirectTemplate} from './components/RedirectTemplate'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>
export const TermsOfServiceScreen = (_props: Props) => {
  const {t: l} = useLingui()
  return (
    <RedirectTemplate
      title={l`Terms of Service`}
      link={urls.website.support.tos}
    />
  )
}
