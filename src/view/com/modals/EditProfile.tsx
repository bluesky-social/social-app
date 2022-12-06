import React, {useState} from 'react'
import * as Toast from '../util/Toast'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet'
import {ErrorMessage} from '../util/ErrorMessage'
import {useStores} from '../../../state'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {s, colors, gradients} from '../../lib/styles'
import {
  enforceLen,
  MAX_DISPLAY_NAME,
  MAX_DESCRIPTION,
} from '../../../lib/strings'
import * as Profile from '../../../third-party/api/src/client/types/app/bsky/actor/profile'
import {UserBanner} from '../util/UserBanner'
import {UserAvatar} from '../util/UserAvatar'

export const snapPoints = ['80%']

export function Component({
  profileView,
  onUpdate,
}: {
  profileView: ProfileViewModel
  onUpdate?: () => void
}) {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>(
    profileView.displayName || '',
  )
  const [description, setDescription] = useState<string>(
    profileView.description || '',
  )
  const [userBanner, setUserBanner] = useState<string | null>(
    profileView.userBanner,
  )
  const [userAvatar, setUserAvatar] = useState<string | null>(
    profileView.userAvatar,
  )
  const onPressCancel = () => {
    store.shell.closeModal()
  }
  const onPressSave = async () => {
    if (error) {
      setError('')
    }
    try {
      await profileView.updateProfile(
        (existing?: Profile.Record): Profile.Record => {
          if (existing) {
            existing.displayName = displayName
            existing.description = description
            return existing
          }
          return {
            displayName,
            description,
          }
        },
        userAvatar, // TEMP
        userBanner, // TEMP
      )
      Toast.show('Profile updated')
      onUpdate?.()
      store.shell.closeModal()
    } catch (e: any) {
      console.error(e)
      setError(
        'Failed to save your profile. Check your internet connection and try again.',
      )
    }
  }

  return (
    <View style={s.flex1}>
      <BottomSheetScrollView style={styles.inner}>
        <Text style={styles.title}>Edit my profile</Text>
        <View style={styles.photos}>
          <UserBanner
            userBanner={userBanner}
            setUserBanner={setUserBanner}
            handle={profileView.handle}
          />
          <View style={styles.avi}>
            <UserAvatar
              size={80}
              userAvatar={userAvatar}
              handle={profileView.handle}
              setUserAvatar={setUserAvatar}
              displayName={profileView.displayName}
            />
          </View>
        </View>
        {error !== '' && (
          <View style={s.mb10}>
            <ErrorMessage message={error} />
          </View>
        )}
        <View>
          <Text style={styles.label}>Display Name</Text>
          <BottomSheetTextInput
            style={styles.textInput}
            placeholder="e.g. Alice Roberts"
            value={displayName}
            onChangeText={v => setDisplayName(enforceLen(v, MAX_DISPLAY_NAME))}
          />
        </View>
        <View style={s.pb10}>
          <Text style={styles.label}>Description</Text>
          <BottomSheetTextInput
            style={[styles.textArea]}
            placeholder="e.g. Artist, dog-lover, and memelord."
            multiline
            value={description}
            onChangeText={v => setDescription(enforceLen(v, MAX_DESCRIPTION))}
          />
        </View>
        <TouchableOpacity style={s.mt10} onPress={onPressSave}>
          <LinearGradient
            colors={[gradients.primary.start, gradients.primary.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text style={[s.white, s.bold]}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={s.mt5} onPress={onPressCancel}>
          <View style={[styles.btn]}>
            <Text style={[s.black, s.bold]}>Cancel</Text>
          </View>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  inner: {
    padding: 14,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 18,
  },
  label: {
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingBottom: 4,
    marginTop: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 10,
    marginBottom: 10,
  },
  avi: {
    position: 'absolute',
    top: 80,
    left: 10,
    width: 84,
    height: 84,
    borderWidth: 2,
    borderRadius: 42,
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  photos: {
    marginBottom: 36,
    marginHorizontal: -14,
  },
})
