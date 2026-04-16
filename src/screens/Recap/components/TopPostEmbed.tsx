/**
 * TopPostEmbed (S15, B10) — fetches the top post by uri and renders via the
 * shared `Post` component. If the fetched view is a tombstone (or fetch
 * fails), promote the next-highest candidate. When all candidates are
 * exhausted, render an inline "no top post available" line.
 *
 * The fallback iteration happens client-side rather than at query time so
 * that moderation filtering benefits from the user's current preferences
 * (which might evolve between the recap fetch and the recap view).
 */

import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {usePostQuery} from '#/state/queries/post'
import {Post} from '#/view/com/post/Post'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

type Ref = {uri: string; cid: string}

export function TopPostEmbed({candidates}: {candidates: Ref[]}) {
  const t = useTheme()
  const [index, setIndex] = useState(0)
  const current = candidates[index]
  const {data, isError, isLoading} = usePostQuery(current?.uri)

  // Promote next candidate on hard fetch error (B10 fallback).
  const handleError = () => {
    if (index + 1 < candidates.length) setIndex(index + 1)
  }

  // Trigger promotion exactly once per index when query errors.
  useMemo(() => {
    if (isError) handleError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, index])

  if (!current) return <NoTopPost />
  if (isLoading) {
    return (
      <View style={[a.px_lg, a.py_md]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Loading top post…</Trans>
        </Text>
      </View>
    )
  }
  // Already-handled error: usePostQuery's useMemo bumped the index.
  if (isError) return null
  if (!data) return <NoTopPost />

  return (
    <View style={[a.px_lg, a.py_sm]}>
      <Post post={data} />
    </View>
  )
}

function NoTopPost() {
  const t = useTheme()
  return (
    <View style={[a.px_lg, a.py_md]}>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>No top post to feature this week.</Trans>
      </Text>
    </View>
  )
}
