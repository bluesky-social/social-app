import {Attie_Filled_Corner0_Rounded as Attie} from '#/components/icons/Attie'
import {isAttieUrl} from './attie'

/** Provider-specific branding and matching for the shared AT embed card. */
const providers = [
  {
    name: 'Attie',
    matches: isAttieUrl,
    Icon: Attie,
    CtaIcon: Attie,
    backgroundColor: '#6338ff',
    hoverColor: '#552fe0',
  },
]

export function getAtCardProvider(uri: string) {
  return providers.find(provider => provider.matches(uri))
}
