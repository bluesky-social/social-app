import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

import {useSession} from '#/state/session'

export const ZENDESK_SUPPORT_URL =
  'https://blueskyweb.zendesk.com/hc/requests/new'

export enum SupportCode {
  AA_DID = 'AA_DID',
  AA_BIRTHDATE = 'AA_BIRTHDATE',
}

/**
 * {@link https://support.zendesk.com/hc/en-us/articles/4408839114522-Creating-pre-filled-ticket-forms}
 */
export function useCreateSupportLink() {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()

  return useCallback(
    ({code, email}: {code: SupportCode; email?: string}) => {
      const url = new URL(ZENDESK_SUPPORT_URL)
      if (currentAccount) {
        url.search = new URLSearchParams({
          tf_anonymous_requester_email: email || currentAccount.email || '', // email will be defined
          tf_description:
            `[Code: ${code}] — ` + l`Please write your message below:`,
          /**
           * Custom field specific to {@link ZENDESK_SUPPORT_URL} form
           */
          tf_17205412673421: currentAccount.handle + ` (${currentAccount.did})`,
        }).toString()
      }
      return url.toString()
    },
    [l, currentAccount],
  )
}
