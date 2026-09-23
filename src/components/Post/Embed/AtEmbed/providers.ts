import {Attie, AttieCloud} from '#/components/icons/community/Attie'
import {createAttieCtaUri, isAttieUrl} from './attie'

/** Provider-specific branding and navigation for the shared AT embed card. */
const providers = [
  {
    name: 'Attie',
    matches: isAttieUrl,
    createDestination: createAttieCtaUri,
    Icon: Attie,
    CtaIcon: AttieCloud,
    backgroundColor: '#6338ff',
    hoverColor: '#552fe0',
  },
]

export function getAtEmbedProvider(uri: string) {
  return providers.find(provider => provider.matches(uri))
}
