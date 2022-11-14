import React, {useState} from 'react'
import Toast from '../util/Toast'
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {ErrorMessage} from '../util/ErrorMessage'
import {useStores} from '../../../state'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {s, colors, gradients} from '../../lib/styles'
import {enforceLen, MAX_DISPLAY_NAME, MAX_DESCRIPTION} from '../../lib/strings'
import * as Profile from '../../../third-party/api/src/client/types/app/bsky/actor/profile'

export const snapPoints = ['80%']

export function Component({profileView}: {profileView: ProfileViewModel}) {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>(
    profileView.displayName || '',
  )
  const [description, setDescription] = useState<string>(
    profileView.description || '',
  )
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
      )
      Toast.show('Profile updated', {
        position: Toast.positions.TOP,
      })
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
      <Text style={[s.textCenter, s.bold, s.f16]}>Edit my profile</Text>
      <View style={styles.inner}>
        {error !== '' && (
          <View style={s.mb10}>
            <ErrorMessage message={error} />
          </View>
        )}
        <View style={styles.group}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Alice Roberts"
            value={displayName}
            onChangeText={v => setDisplayName(enforceLen(v, MAX_DISPLAY_NAME))}
          />
        </View>
        <View style={styles.group}>
          <Text style={styles.label}>Description</Text>
          <TextInput
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inner: {
    padding: 14,
  },
  group: {
    marginBottom: 10,
  },
  label: {
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
})
