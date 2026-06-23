import {useCallback} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {getActiveBrand} from '#/brand/activeBrand'

const SUPPORT_FORM_URL = getActiveBrand().links.feedbackForm
const IS_ZENDESK_FORM = SUPPORT_FORM_URL.includes('zendesk')

export enum SupportCode {
  AA_DID = 'AA_DID',
  AA_BIRTHDATE = 'AA_BIRTHDATE',
}

/**
 * {@link https://support.zendesk.com/hc/en-us/articles/4408839114522-Creating-pre-filled-ticket-forms}
 */
export function useCreateSupportLink() {
  const {_} = useLingui()
  const {currentAccount} = useSession()

  return useCallback(
    ({code, email}: {code: SupportCode; email?: string}) => {
      const url = new URL(SUPPORT_FORM_URL)
      // The prefill params are specific to the Zendesk request form. Brands
      // with a non-Zendesk feedback destination (e.g. a Google Form) are used
      // as-is.
      if (IS_ZENDESK_FORM && currentAccount) {
        url.search = new URLSearchParams({
          tf_anonymous_requester_email: email || currentAccount.email || '', // email will be defined
          tf_description:
            `[Code: ${code}] — ` + _(msg`Please write your message below:`),
          /**
           * Custom field specific to the Zendesk support form.
           */
          tf_17205412673421: currentAccount.handle + ` (${currentAccount.did})`,
        }).toString()
      }
      return url.toString()
    },
    [_, currentAccount],
  )
}
