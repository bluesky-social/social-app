import {useEffect, useState} from 'react'
import * as Linking from 'expo-linking'

import {parseLinkingUrl} from '#/lib/parseLinkingUrl'
import {
  createStarterPackLinkFromAndroidReferrer,
  httpStarterPackUriToAtUri,
} from '#/lib/strings/starter-pack'
import {CHAT_INVITE_CODE_REGEX} from '#/lib/strings/url-helpers'
import {useHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {
  useSetActiveLanding,
  useSetActiveStarterPack,
} from '#/state/shell/landing'
import {IS_ANDROID} from '#/env'
import {Referrer, SharedPrefs} from '../../../modules/expo-bluesky-swiss-army'

export function useLandingEntry() {
  const [ready, setReady] = useState(false)
  const setActiveStarterPack = useSetActiveStarterPack()
  const setActiveLanding = useSetActiveLanding()
  const hasCheckedForStarterPack = useHasCheckedForStarterPack()

  useEffect(() => {
    if (ready) return

    // Check for group chat invite link from the initial deep link URL
    const linkingUrl = Linking.getLinkingURL()
    if (linkingUrl) {
      const urlp = parseLinkingUrl(linkingUrl)
      const chatInviteMatch = urlp.pathname.match(CHAT_INVITE_CODE_REGEX)
      if (chatInviteMatch) {
        setActiveLanding({
          type: 'groupchat',
          uri: linkingUrl,
          code: chatInviteMatch[1],
        })
        setReady(true)
        return
      }
    }

    // On Android, we cannot clear the referral link. It gets stored for 90 days and all we can do is query for it. So,
    // let's just ensure we never check again after the first time.
    if (hasCheckedForStarterPack) {
      setReady(true)
      return
    }

    // Safety for Android. Very unlike this could happen, but just in case. The response should be nearly immediate
    const timeout = setTimeout(() => {
      setReady(true)
    }, 500)

    void (async () => {
      // Check for starter pack
      let uri: string | null | undefined

      if (IS_ANDROID) {
        const res = await Referrer.getGooglePlayReferrerInfoAsync()

        if (res && res.installReferrer) {
          uri = createStarterPackLinkFromAndroidReferrer(res.installReferrer)
        }
      } else {
        const starterPackUri = SharedPrefs.getString('starterPackUri')
        if (starterPackUri) {
          uri = httpStarterPackUriToAtUri(starterPackUri)
          SharedPrefs.setValue('starterPackUri', null)
        }
      }

      if (uri) {
        setActiveStarterPack({
          uri,
        })
      }

      setReady(true)
    })()

    return () => {
      clearTimeout(timeout)
    }
  }, [ready, setActiveStarterPack, setActiveLanding, hasCheckedForStarterPack])

  return ready
}
