import {GrainMark} from '#/components/icons/community/Grain'
import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'
import {Streamplace} from '#/components/icons/community/Streamplace'

export type AtmosphereProvider = {
  name: string
  Icon: typeof Leaflet
}

/**
 * How to display each app the appview can attribute a record to, keyed by the
 * `providerId` it returns on external views.
 */
const PROVIDERS = new Map<string, AtmosphereProvider>([
  ['leaflet.pub', {name: 'Leaflet', Icon: Leaflet}],
  ['pckt.blog', {name: 'pckt', Icon: Pckt}],
  ['offprint.app', {name: 'Offprint', Icon: Offprint}],
  ['grain.social', {name: 'Grain', Icon: GrainMark}],
  ['stream.place', {name: 'Streamplace', Icon: Streamplace}],
])

/**
 * The app the appview attributes a record to. This is best-effort and
 * unverified, so only use it for labels and icons. Unknown ids return
 * `undefined` rather than showing the raw id, which is a domain, not a name.
 */
export function getAtmosphereProvider(
  providerId: string | undefined,
): AtmosphereProvider | undefined {
  return providerId ? PROVIDERS.get(providerId) : undefined
}
