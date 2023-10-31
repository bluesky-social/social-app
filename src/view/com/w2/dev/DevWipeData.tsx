import React, {useCallback, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {View, TextInput, Alert, TouchableOpacity} from 'react-native'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'
import {StyleSheet} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {GroupItem} from '../../modals/waverly/group-search/GroupItem'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {GroupSearchItem} from 'w2-api/waverly_sdk'

export const DevWipeData = observer(function DevWipeData() {
  const store = useStores()
  const pal = usePalette('default')

  const [handle, setHandle] = useState('')
  const wipeGroupData = useCallback(async () => {
    try {
      await Promise.all([
        store.waverlyAgent.api.wipeGroupCredData(),
        store.waverlyAgent.api.wipeGroupWaveData(),
      ])
    } catch (err: any) {
      store.log.error(`Error in wipeGroupCredAndWaves`, err.toString())
    }
  }, [store.log, store.waverlyAgent.api])

  const onWipeGroupCredAndWavesPress = useCallback(async () => {
    Alert.alert(
      'Are you sure?',
      `This will clear all group's credentials and waves`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', onPress: wipeGroupData, style: 'destructive'},
      ],
    )
  }, [wipeGroupData])

  const populateGroupCreds = useCallback(async () => {
    try {
      await store.waverlyAgent.api.populateGroupCreds()
    } catch (err: any) {
      store.log.error(`Error in populateGroupCreds`, err.toString())
    }
  }, [store.log, store.waverlyAgent.api])

  const onPopulateGroupCredPress = useCallback(() => {
    Alert.alert('Heads up!', `Make sure you have wiped the old data first`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Populate', onPress: populateGroupCreds, style: 'default'},
    ])
  }, [populateGroupCreds])

  const wipePosts = useCallback(async () => {
    try {
      const didRes = await store.agent.resolveHandle({
        handle,
      })
      await store.waverlyAgent.api.wipePostsFromGroup({
        groupDid: didRes.data.did,
      })
      await store.me.waverlyFeed.refresh()
    } catch (err: any) {
      store.log.error(`Error in wipePosts`, err.toString())
    }
  }, [
    handle,
    store.agent,
    store.log,
    store.me.waverlyFeed,
    store.waverlyAgent.api,
  ])

  const onWipePostsPress = useCallback(() => {
    Alert.alert(
      'Are you sure?',
      `This action will delete your (${store.me.handle}) posts in ${handle}`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', onPress: wipePosts, style: 'destructive'},
      ],
    )
  }, [handle, store.me.handle, wipePosts])

  const onGroupSelectedCallback = useCallback((g: GroupSearchItem) => {
    setHandle(g.handle)
    console.log('setting group item: ', g)
  }, [])
  const onGroupSelectorPress = useCallback(() => {
    store.shell.openModal({
      name: 'group-selector',
      onSelect: onGroupSelectedCallback,
    })
  }, [onGroupSelectedCallback, store.shell])

  return (
    <View style={[s.flex1, s.p10]}>
      <View style={styles.blackLine} />
      <View style={[s.p10]} />
      <Text type="xl-bold">{'Wipe Group Creds and Data'}</Text>
      <View style={[s.p10]} />
      <View style={[s.flexRow, s.g5, s.alignCenter]}>
        <Text style={pal.text}>Group Creds & Waves:</Text>
        <Text
          style={[styles.underline, pal.text]}
          onPress={onWipeGroupCredAndWavesPress}>
          Nuke it!
        </Text>
        <Text style={[pal.text]}>☢️</Text>
        <Text style={[pal.text]}>•</Text>
        <Text
          style={[styles.underline, pal.text]}
          onPress={onPopulateGroupCredPress}>
          Populate
        </Text>
      </View>
      <View style={[s.p10]} />
      <View style={styles.blackLine} />
      <View style={[s.p10]} />
      <View style={[s.p10]} />
      <Text type="xl-bold">{'Delete Posts'}</Text>
      <View style={[s.p10]} />
      <TouchableOpacity
        accessibilityRole="button"
        style={[s.p10, s.flexRow, s.alignCenter, s.g5, s.pb20]}
        onPress={onGroupSelectorPress}>
        <GroupItem group={undefined} emptyPlaceholder="Select Wave" />
        <FontAwesomeIcon
          icon="angle-down"
          size={16}
          style={pal.text as FontAwesomeIconStyle}
        />
      </TouchableOpacity>
      <View style={[s.flexRow, s.g5, s.alignCenter]}>
        <Text style={pal.text}>Del posts from:</Text>
        <View style={[pal.border, styles.textInputLayout]}>
          <TextInput
            accessibilityLabel="Text input field"
            accessibilityHint="Wave handle"
            value={handle}
            onChangeText={setHandle}
            placeholder="Wave handle"
            autoCapitalize="none"
            style={[s.flex1, pal.text]}
          />
        </View>
        <Text style={[styles.underline, pal.text]} onPress={onWipePostsPress}>
          Go
        </Text>
      </View>
      <View style={[s.p10]} />
      <Text style={pal.text}>
        By pressing 'Go', all posts from you ({store.me.handle}) in {handle}{' '}
        will be deleted.
      </Text>
      <View style={[s.p10]} />
      <View style={styles.blackLine} />
    </View>
  )
})

const styles = StyleSheet.create({
  underline: {
    textDecorationLine: 'underline',
  },
  textInputLayout: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flex: 1,
  },
  blackLine: {
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})
