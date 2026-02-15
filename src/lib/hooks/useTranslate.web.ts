import {useCallback} from 'react'

import {getTranslatorLink} from '#/locale/helpers'
import {useOpenLink} from './useOpenLink'

export function useTranslate() {
  const openLink = useOpenLink()

  return useCallback(
    async (text: string, language: string, _opts?: {postUri?: string}) => {
      const translateUrl = getTranslatorLink(text, language)
      await openLink(translateUrl)
    },
    [openLink],
  )
}
