import {useMemo} from 'react'
import {RichText as RichTextAPI} from '@atproto/api'

export function useRichText(text: string): RichTextAPI {
  return useMemo(() => {
    const rt = new RichTextAPI({text})
    rt.detectFacetsWithoutResolution()
    return rt
  }, [text])
}
