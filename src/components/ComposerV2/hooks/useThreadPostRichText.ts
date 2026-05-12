import {useMemo} from 'react'
import {RichText} from '@atproto/api'

import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {useThreadPost} from '#/components/ComposerV2/hooks/useThreadPost'

/**
 * Derived RichText for a post's text. Recomputes only when the underlying
 * `text` changes (not on unrelated mutations like alt-text or upload
 * status). detectFacetsWithoutResolution is regex-only, so this is cheap
 * to run per-keystroke for typical post lengths.
 *
 * `shortenedGraphemeLength` matches the value the existing draft adapter
 * stores - the count after URL shortening, used for the post char limit.
 */
export function useThreadPostRichText(postId: string): {
  richtext: RichText
  shortenedGraphemeLength: number
} {
  const post = useThreadPost(postId)
  const text = post?.text ?? ''
  return useMemo(() => {
    const richtext = new RichText({text})
    richtext.detectFacetsWithoutResolution()
    return {
      richtext,
      shortenedGraphemeLength: shortenLinks(richtext).graphemeLength,
    }
  }, [text])
}
