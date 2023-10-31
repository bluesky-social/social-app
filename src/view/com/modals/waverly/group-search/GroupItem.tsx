import React, {useCallback, useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {GroupSearchItem} from 'w2-api/waverly_sdk'
import {useStores} from 'state/index'
import {ProfileViewBasic} from '@atproto/api/dist/client/types/app/bsky/actor/defs'

export function GroupItem({
  group,
  emptyPlaceholder,
}: {
  group: GroupSearchItem | undefined
  emptyPlaceholder?: string
}) {
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
    if (group && group.handle) {
      resolveProfile(group.handle).then(r => {
        if (r) setGroupInfo(r)
      })
    }
  }, [group, resolveProfile])

  return (
    <View style={styles.container} key={group?.handle ?? 'key-group-item'}>
      <UserAvatar size={32} type={'list'} avatar={groupInfo?.avatar} />
      <Text type="xl-bold" style={[pal.text]}>
        {groupInfo?.displayName ??
          group?.handle ??
          emptyPlaceholder ??
          'Unknown group'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
})
