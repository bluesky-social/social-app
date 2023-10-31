import React, {useCallback, useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {usePalette} from 'lib/hooks/usePalette'
import {CardHeader} from './CardHeader'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {alphaBg, colors} from 'lib/styles'
import {Recommendation} from 'w2-api/waverly_sdk'
import {useStores} from 'state/index'
import {ProfileViewBasic} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'
import {ProfileViewDetailed} from '@atproto/api/dist/client/types/app/bsky/actor/defs'

interface Props {
  groupPost?: PostsFeedItemModel
  rec?: Recommendation
  children?: React.ReactNode
}

export const CardFrame = observer(function CardFrame({
  groupPost,
  rec,
  children,
}: Props) {
  const pal = usePalette('default')
  const stores = useStores()

  const [groupInfo, setGroupInfo] = useState<ProfileViewBasic>()
  const [userInfo, setUserInfo] = useState<ProfileViewBasic>()

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
      const user = (groupPost?.reply?.root as PostView | undefined)?.author
      const group = groupPost?.post.author
      if (user) setUserInfo(toBasicProfile(user))
      if (group) setGroupInfo(toBasicProfile(group))
    } else if (rec) {
      setUserInfo({
        did: 'did:mock-value',
        handle: 'waverly.social',
        displayName: 'Waverly',
        avatar: undefined,
      })
      // TODO: get Waverly userAvatar

      if (rec.sectionTitle) {
        resolveProfile(rec.sectionTitle).then(r => {
          if (r) setGroupInfo(r)
        })
      }
    }
  }, [groupPost, rec, resolveProfile])

  if ((!groupPost && !rec) || !groupInfo) return <></>

  const isWaverlyRec = !!rec

  return (
    <View
      style={[
        styles.container,
        groupPost ? alphaBg(pal.view, 0.3) : styles.waverlyCardColor,
      ]}>
      <CardHeader
        userName={userInfo?.displayName || '<unknown>'}
        userInfo={userInfo}
        avatar={userInfo?.avatar}
        isWaverlyRec={isWaverlyRec}
        group={groupInfo}
      />
      {/* <View style={styles.content}>{children}</View> */}
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    gap: 10,
    padding: 10,
    borderRadius: 16,
    flex: 1,
    minHeight: 500,
  },
  content: {
    flex: 1,
  },
  waverlyCardColor: {
    backgroundColor: colors.waverly1,
  },
})

// helpers
// =

function toBasicProfile(p: ProfileViewDetailed): ProfileViewBasic {
  return {
    did: p.did,
    handle: p.handle,
    displayName: p.displayName ?? '<Unknown group>',
    avatar: p.avatar,
  }
}
