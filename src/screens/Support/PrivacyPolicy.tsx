import {useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {urls} from '#/lib/constants'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {RedirectTemplate} from './components/RedirectTemplate'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PrivacyPolicy'>
export const PrivacyPolicyScreen = (_props: Props) => {
  const {t: l} = useLingui()
  return (
    <RedirectTemplate
      title={l`Privacy Policy`}
      link={urls.website.support.privacy}
    />
  )
}
