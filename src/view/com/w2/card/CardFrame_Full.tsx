import React, {useCallback, useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {usePalette} from 'lib/hooks/usePalette'
import {CardHeader_Full} from './CardHeader_Full'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {alphaBg, colors} from 'lib/styles'
import {Recommendation} from 'w2-api/waverly_sdk'
import {useStores} from 'state/index'
import {ProfileViewBasic} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'
import {ProfileViewDetailed} from '@atproto/api/dist/client/types/app/bsky/actor/defs'

function toBasicProfile(p: ProfileViewDetailed): ProfileViewBasic {
  return {
    did: p.did,
    handle: p.handle,
    displayName: p.displayName ?? '<Unknown group>',
    avatar: p.avatar,
  }
}

interface Props {
  groupPost?: PostsFeedItemModel
  rec?: Recommendation
  children?: React.ReactNode
}

export const CardFrame_Full = observer(function CardFrame_Full({
  groupPost,
  rec,
  children,
}: Props) {
  const pal = usePalette('default')
  const stores = useStores()

  const [groupInfo, setGroupInfo] = useState<ProfileViewBasic>()

  const resolveProfile = useCallback(
    async (handle: string) => {
      const res = await stores.agent.resolveHandle({handle})
      if (!res.success) return undefined

      const profileRes = await stores.profiles.getProfile(res.data.did)
      return profileRes.success ? profileRes.data : undefined
    },
    [stores.agent, stores.profiles],
  )

  useEffect(() => {
    if (groupPost) {
      const group = groupPost?.post.author
      if (group) setGroupInfo(toBasicProfile(group))
    }
  }, [groupPost])

  useEffect(() => {
    if (rec) {
      if (rec.sectionTitle) {
        resolveProfile(rec.sectionTitle).then(r => {
          if (r) setGroupInfo(r)
        })
      }
    }
  }, [rec, resolveProfile])

  if ((!groupPost && !rec) || !groupInfo) return <></>

  const isWaverlyRec = !!rec

  return (
    <View
      style={[
        styles.container,
        groupPost ? alphaBg(pal.view, 0.3) : styles.waverlyCardColor,
      ]}>
      <CardHeader_Full group={groupInfo} isWaverlyRec={isWaverlyRec} />
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    gap: 0,
    padding: 0,
    borderRadius: 16,
    flex: 1,
  },
  waverlyCardColor: {
    backgroundColor: colors.waverly1,
  },
})
