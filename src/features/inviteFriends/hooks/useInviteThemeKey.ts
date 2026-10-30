import {device, useStorage} from '#/storage'
import {INVITE_THEMES, type InviteThemeKey} from '../themes'

/**
 * Persisted color theme for the Invite Friends QR card (APP-2409). Falls back
 * to 'day' when nothing is stored or the stored key is no longer a valid
 * theme.
 */
export function useInviteThemeKey() {
  const [stored, setThemeKey] = useStorage(device, ['inviteFriendsThemeKey'])
  const themeKey: InviteThemeKey =
    stored && stored in INVITE_THEMES ? stored : 'day'
  return [themeKey, setThemeKey] as const
}
