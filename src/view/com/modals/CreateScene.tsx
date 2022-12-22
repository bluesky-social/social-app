import React, {useState} from 'react'
import * as Toast from '../util/Toast'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet'
import {AppBskyActorCreateScene} from '@atproto/api'
import {ErrorMessage} from '../util/ErrorMessage'
import {Text} from '../util/Text'
import {useStores} from '../../../state'
import {s, colors, gradients} from '../../lib/styles'
import {
  makeValidHandle,
  createFullHandle,
  enforceLen,
  MAX_DISPLAY_NAME,
  MAX_DESCRIPTION,
} from '../../../lib/strings'

export const snapPoints = ['60%']

export function Component({}: {}) {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [handle, setHandle] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const onPressSave = async () => {
    setIsProcessing(true)
    if (error) {
      setError('')
    }
    try {
      if (!store.me.did) {
        return
      }
      const desc = await store.api.com.atproto.server.getAccountsConfig()
      const fullHandle = createFullHandle(
        handle,
        desc.data.availableUserDomains[0],
      )
      // create scene actor
      const createSceneRes = await store.api.app.bsky.actor.createScene({
        handle: fullHandle,
      })
      // set the scene profile
      await store.api.app.bsky.actor
        .updateProfile({
          did: createSceneRes.data.did,
          displayName,
          description,
        })
        .catch(e => console.error(e)) // an error here is not critical
      // follow the scene
      await store.api.app.bsky.graph.follow
        .create(
          {
            did: store.me.did,
          },
          {
            subject: {
              did: createSceneRes.data.did,
              declarationCid: createSceneRes.data.declaration.cid,
            },
            createdAt: new Date().toISOString(),
          },
        )
        .catch(e => console.error(e)) // an error here is not critical
      Toast.show('Scene created')
      store.shell.closeModal()
      store.nav.navigate(`/profile/${fullHandle}`)
    } catch (e: any) {
      if (e instanceof AppBskyActorCreateScene.InvalidHandleError) {
        setError(
          'The handle can only contain letters, numbers, and dashes, and must start with a letter.',
        )
      } else if (e instanceof AppBskyActorCreateScene.HandleNotAvailableError) {
        setError(`The handle "${handle}" is not available.`)
      } else {
        console.error(e)
        setError(
          'Failed to create the scene. Check your internet connection and try again.',
        )
      }
      setIsProcessing(false)
    }
  }
  const onPressCancel = () => {
    store.shell.closeModal()
  }

  return (
    <View style={styles.outer}>
      <BottomSheetScrollView style={styles.inner}>
        <Text style={[styles.title, s.black]}>Create a scene</Text>
        <Text style={styles.description}>
          Scenes are invite-only groups which aggregate what's popular with
          members.
        </Text>
        <View style={{paddingBottom: 50}}>
          <View style={styles.group}>
            <Text style={[styles.label, s.black]}>Scene Handle</Text>
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="e.g. alices-friends"
              placeholderTextColor={colors.gray4}
              autoCorrect={false}
              value={handle}
              onChangeText={str => setHandle(makeValidHandle(str))}
            />
          </View>
          <View style={styles.group}>
            <Text style={[styles.label, s.black]}>Scene Display Name</Text>
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="e.g. Alice's Friends"
              placeholderTextColor={colors.gray4}
              value={displayName}
              onChangeText={v =>
                setDisplayName(enforceLen(v, MAX_DISPLAY_NAME))
              }
            />
          </View>
          <View style={styles.group}>
            <Text style={[styles.label, s.black]}>Scene Description</Text>
            <BottomSheetTextInput
              style={[styles.textArea]}
              placeholder="e.g. Artists, dog-lovers, and memelords."
              placeholderTextColor={colors.gray4}
              multiline
              value={description}
              onChangeText={v => setDescription(enforceLen(v, MAX_DESCRIPTION))}
            />
          </View>
          {error !== '' && (
            <View style={s.mb10}>
              <ErrorMessage message={error} numberOfLines={3} />
            </View>
          )}
          {handle.length >= 2 && !isProcessing ? (
            <TouchableOpacity style={s.mt10} onPress={onPressSave}>
              <LinearGradient
                colors={[gradients.primary.start, gradients.primary.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.btn]}>
                <Text style={[s.white, s.bold, s.f18]}>Create Scene</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={s.mt10}>
              <View style={[styles.btn]}>
                {isProcessing ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={[s.gray4, s.bold, s.f18]}>Create Scene</Text>
                )}
              </View>
            </View>
          )}
          <TouchableOpacity style={s.mt10} onPress={onPressCancel}>
            <View style={[styles.btn, {backgroundColor: colors.white}]}>
              <Text style={[s.black, s.bold]}>Cancel</Text>
            </View>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    // paddingTop: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    fontSize: 17,
    paddingHorizontal: 22,
    color: colors.gray5,
    marginBottom: 10,
  },
  inner: {
    padding: 14,
    height: 350,
  },
  group: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.black,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 16,
    color: colors.black,
    height: 70,
    textAlignVertical: 'top',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
})
