import {Attie, AttieCloud} from '#/components/icons/community/Attie'
import {isAttieUrl} from './attie'

/** Provider-specific branding and matching for the shared AT embed card. */
const providers = [
  {
    name: 'Attie',
    matches: isAttieUrl,
    Icon: Attie,
    CtaIcon: AttieCloud,
    backgroundColor: '#6338ff',
    hoverColor: '#552fe0',
  },
]

export function getAtCardProvider(uri: string) {
  return providers.find(provider => provider.matches(uri))
}
