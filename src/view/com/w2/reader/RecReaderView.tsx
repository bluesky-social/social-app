import React, {useCallback, useEffect, useState} from 'react'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {BaseReaderView} from './BaseReaderView'
import {ProfileViewBasic} from '@atproto/bsky/dist/lexicon/types/app/bsky/actor/defs'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'RecReaderView'>

export const RecReaderView = observer(function RecReaderView({route}: Props) {
  const {recId} = route.params

  const store = useStores()
  const [linkInfo, setLinkInfo] = useState<EmbedInfo['link']>()
  const [groupInfo, setGroupInfo] = useState<ProfileViewBasic>()

  const resolveProfile = useCallback(
    async (handle: string) => {
      const res = await store.agent.resolveHandle({handle})
      if (!res.success) return undefined

      const profileRes = await store.profiles.getProfile(res.data.did)
      return profileRes.success ? profileRes.data : undefined
    },
    [store.agent, store.profiles],
  )

  useEffect(() => {
    const r = store.waverlyAgent.getRecommendationFromCache(recId)
    if (!r) return

    setLinkInfo({
      title: r.title,
      description: '',
      length: r.time,
      host: r.source,
      uri: r.href,
      originalUri: r.href,
    })

    if (r.sectionTitle) {
      resolveProfile(r.sectionTitle).then(gi => {
        if (gi) setGroupInfo(gi)
      })
    }
  }, [recId, resolveProfile, store.waverlyAgent])

  return (
    <BaseReaderView
      link={linkInfo}
      groupDid={groupInfo?.did}
      groupHandle={groupInfo?.handle}
    />
  )
})
