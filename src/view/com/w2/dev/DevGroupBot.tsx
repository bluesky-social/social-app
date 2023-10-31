import React, {useCallback, useEffect, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ListRenderItemInfo,
} from 'react-native'
import {Text} from '../../util/text/Text'
import {colors, s} from 'lib/styles'
import {StyleSheet} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import * as Toast from '../../util/Toast'
import {GroupSearchItem, GroupWave, Recommendation} from 'w2-api/waverly_sdk'
import {pressableOpacity} from 'lib/pressableOpacity'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

export const DevGroupBot = observer(function DevGroupBot() {
  const store = useStores()
  const pal = usePalette('default')
  const [error, setError] = useState('')
  const [did, setDid] = useState('')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [wave, setWave] = useState<GroupWave>()
  const [waveText, setWaveText] = useState('')
  const [group, setGroup] = useState<GroupSearchItem>()
  const [canAddUpdate, setCanAddUpdate] = useState(false)
  const [recs, setRecs] = useState<Recommendation[]>([])

  const clearInputs = useCallback(() => {
    setWaveText('')
    setWave(undefined)
    setHandle('')
    setDid('')
    setPassword('')
    setGroup(undefined)
    setError('')
    setRecs([])
  }, [])

  useEffect(() => {
    if (!group) setCanAddUpdate(!!handle && !!did && !!password)
    else setCanAddUpdate(true)
  }, [did, group, handle, password])

  const addOrUpdateGroup = useCallback(async () => {
    try {
      if (group && waveText) {
        const res = await store.waverlyAgent.addOrUpdateGroupWave(
          group.did,
          waveText,
        )
        if (res) {
          Toast.show(`Group wave updated!`)
          clearInputs()
        } else setError('Failed to update group wave')
      } else {
        const res = await store.waverlyAgent.api.addGroupBot({
          input: {did, handle, password},
        })
        if (res.addGroupBot?.success) {
          Toast.show(`Group added!`)
          clearInputs()
        } else setError('Failed to add group')
      }
    } catch (e: any) {
      setError(e.message)
    }
  }, [clearInputs, did, group, handle, password, store.waverlyAgent, waveText])

  const fetchWave = useCallback(async () => {
    if (group) {
      try {
        const res = await store.waverlyAgent.api.getGroupWave({
          groupDid: group.did,
        })
        setWave(res.getGroupWave ?? undefined)
        setWaveText(res.getGroupWave?.text ?? '')
      } catch (e: any) {
        setError(e.message)
      }
    }
  }, [group, store.waverlyAgent.api])

  useEffect(() => {
    if (group) {
      setDid(group.did)
      setHandle(group.handle)
      fetchWave()
      setError('')
    }
  }, [fetchWave, group])

  const fetchRecs = useCallback(async () => {
    if (wave) {
      try {
        const res = await store.waverlyAgent.getQueryRecommendations([wave])
        setRecs(res)
      } catch (e: any) {
        setError(e.message)
      }
    }
  }, [store.waverlyAgent, wave])

  useEffect(() => {
    if (wave) fetchRecs()
  }, [fetchRecs, wave])

  const onFindGroupPress = useCallback(() => {
    store.shell.openModal({name: 'group-selector', onSelect: setGroup})
  }, [store.shell])

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<Recommendation>) => {
      return (
        <View style={styles.articleView}>
          <Text style={pal.textInverted} type={'xl-bold'}>
            {item.title}
          </Text>
          <View style={styles.divider} />
          <Text style={pal.textInverted} type={'lg'}>
            {item.summary.substring(0, 500) + '...'}
          </Text>
        </View>
      )
    },
    [pal.textInverted],
  )

  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.flex1, s.flexCol, s.h100pct]}
      keyboardVerticalOffset={insets.bottom + insets.top}>
      <ScrollView style={[s.flex1]} contentContainerStyle={[s.p10]}>
        {error !== '' && (
          <View style={styles.errorLine}>
            <Text style={[s.red4, s.flex1]}>{error}</Text>
          </View>
        )}
        <View style={[s.w100pct, s.alignCenter, s.p20]}>
          <TouchableOpacity
            style={[s.p10, styles.findBtn]}
            onPress={onFindGroupPress}
            accessibilityRole="button">
            <Text style={pal.textInverted}>{'Find Group'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[pal.textLight, s.p5]}>{'DID'}</Text>
        <View style={[pal.border, styles.textInputLayout]}>
          <TextInput
            value={did}
            placeholder={'Enter group did'}
            onChangeText={t => setDid(t)}
            accessible={true}
            accessibilityLabel="Group DID"
            accessibilityHint="Group DID"
            style={[s.flex1, group ? pal.textLight : pal.text]}
            editable={!group}
          />
        </View>
        <View style={styles.divider} />
        <Text style={[pal.textLight, s.p5]}>{'Handle'}</Text>
        <View style={[pal.border, styles.textInputLayout]}>
          <TextInput
            value={handle}
            placeholder={'Enter group hanlde'}
            onChangeText={t => setHandle(t)}
            accessible={true}
            accessibilityLabel="Group identifier"
            accessibilityHint="Group identifier"
            style={[s.flex1, group ? pal.textLight : pal.text]}
            editable={!group}
          />
        </View>
        <View style={styles.divider} />
        {!group && (
          <>
            <Text style={[pal.textLight, s.p5]}>{'Password'}</Text>
            <View style={[pal.border, styles.textInputLayout]}>
              <TextInput
                // secureTextEntry={true}
                value={password}
                placeholder={`Enter group password`}
                onChangeText={t => setPassword(t)}
                accessible={true}
                accessibilityLabel="Group password"
                accessibilityHint="Select group password"
                style={s.flex1}
                editable={!group}
              />
            </View>
            <View style={styles.divider} />
          </>
        )}
        {group && (
          <>
            <Text style={[pal.textLight, s.p5]}>{'Wave'}</Text>
            <View style={[pal.border, styles.textInputLayout]}>
              <TextInput
                value={waveText}
                multiline
                placeholder={'Enter wave text'}
                onChangeText={t => setWaveText(t)}
                accessible={true}
                accessibilityLabel="Wave text"
                accessibilityHint="Set wave text"
                style={[s.flex1, styles.waveInput]}
                editable={!!group}
              />
            </View>
            <View style={styles.divider} />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={addOrUpdateGroup}
          style={pressableOpacity(styles.postBtn)}
          disabled={!canAddUpdate}>
          <Text type="post-text" style={pal.textInverted}>
            {group ? 'Update Group' : 'Add Group'}
          </Text>
        </Pressable>
        <View style={styles.divider} />
        <FlatList
          data={recs}
          renderItem={renderItem}
          horizontal
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  errorLine: {
    flexDirection: 'row',
    backgroundColor: colors.red1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 6,
  },
  textInputLayout: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  divider: {height: 12},
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    height: 55,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findBtn: {backgroundColor: colors.blue7, borderRadius: 10},
  waveInput: {
    height: 250,
  },
  articleView: {
    width: 300,
    marginRight: 15,
    backgroundColor: colors.blue2,
    borderRadius: 20,
    padding: 12,
  },
})
