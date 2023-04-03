import React, {useState} from 'react'
import * as Toast from '../util/Toast'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {ScrollView, TextInput} from './util'
import {PickedMedia} from '../../../lib/media/picker'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from 'state/index'
import {ProfileModel} from 'state/models/content/profile'
import {s, colors, gradients} from 'lib/styles'
import {enforceLen} from 'lib/strings/helpers'
import {MAX_DISPLAY_NAME, MAX_DESCRIPTION} from 'lib/constants'
import {compressIfNeeded} from 'lib/media/manip'
import {UserBanner} from '../util/UserBanner'
import {UserAvatar} from '../util/UserAvatar'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useAnalytics} from 'lib/analytics'
import {cleanError, isNetworkError} from 'lib/strings/errors'

export const snapPoints = ['80%']

export function Component({
  profileView,
  onUpdate,
}: {
  profileView: ProfileModel
  onUpdate?: () => void
}) {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()

  const [isProcessing, setProcessing] = useState<boolean>(false)
  const [displayName, setDisplayName] = useState<string>(
    profileView.displayName || '',
  )
  const [description, setDescription] = useState<string>(
    profileView.description || '',
  )
  const [userBanner, setUserBanner] = useState<string | undefined | null>(
    profileView.banner,
  )
  const [userAvatar, setUserAvatar] = useState<string | undefined | null>(
    profileView.avatar,
  )
  const [newUserBanner, setNewUserBanner] = useState<
    PickedMedia | undefined | null
  >()
  const [newUserAvatar, setNewUserAvatar] = useState<
    PickedMedia | undefined | null
  >()
  const onPressCancel = () => {
    store.shell.closeModal()
  }
  const onSelectNewAvatar = async (img: PickedMedia | null) => {
    track('EditProfile:AvatarSelected')
    try {
      // if img is null, user selected "remove avatar"
      if (!img) {
        setNewUserAvatar(null)
        setUserAvatar(null)
        return
      }
      const finalImg = await compressIfNeeded(img, 1000000)
      setNewUserAvatar({mediaType: 'photo', ...finalImg})
      setUserAvatar(finalImg.path)
    } catch (e: any) {
      setError(cleanError(e))
    }
  }
  const onSelectNewBanner = async (img: PickedMedia | null) => {
    if (!img) {
      setNewUserBanner(null)
      setUserBanner(null)
      return
    }
    track('EditProfile:BannerSelected')
    try {
      const finalImg = await compressIfNeeded(img, 1000000)
      setNewUserBanner({mediaType: 'photo', ...finalImg})
      setUserBanner(finalImg.path)
    } catch (e: any) {
      setError(cleanError(e))
    }
  }
  const onPressSave = async () => {
    track('EditProfile:Save')
    setProcessing(true)
    if (error) {
      setError('')
    }
    try {
      await profileView.updateProfile(
        {
          displayName,
          description,
        },
        newUserAvatar,
        newUserBanner,
      )
      Toast.show('Profile updated')
      onUpdate?.()
      store.shell.closeModal()
    } catch (e: any) {
      if (isNetworkError(e)) {
        setError(
          'Failed to save your profile. Check your internet connection and try again.',
        )
      } else {
        setError(cleanError(e))
      }
    }
    setProcessing(false)
  }

  return (
    <View style={[s.flex1, pal.view]} testID="editProfileModal">
      <ScrollView style={styles.inner}>
        <Text style={[styles.title, pal.text]}>Edit my profile</Text>
        <View style={styles.photos}>
          <UserBanner
            banner={userBanner}
            onSelectNewBanner={onSelectNewBanner}
          />
          <View style={[styles.avi, {borderColor: pal.colors.background}]}>
            <UserAvatar
              size={80}
              avatar={userAvatar}
              onSelectNewAvatar={onSelectNewAvatar}
            />
          </View>
        </View>
        {error !== '' && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}
        <View>
          <Text style={[styles.label, pal.text]}>Display Name</Text>
          <TextInput
            testID="editProfileDisplayNameInput"
            style={[styles.textInput, pal.text]}
            placeholder="e.g. Alice Roberts"
            placeholderTextColor={colors.gray4}
            value={displayName}
            onChangeText={v => setDisplayName(enforceLen(v, MAX_DISPLAY_NAME))}
          />
        </View>
        <View style={s.pb10}>
          <Text style={[styles.label, pal.text]}>Description</Text>
          <TextInput
            testID="editProfileDescriptionInput"
            style={[styles.textArea, pal.text]}
            placeholder="e.g. Artist, dog-lover, and memelord."
            placeholderTextColor={colors.gray4}
            keyboardAppearance={theme.colorScheme}
            multiline
            value={description}
            onChangeText={v => setDescription(enforceLen(v, MAX_DESCRIPTION))}
          />
        </View>
        {isProcessing ? (
          <View style={[styles.btn, s.mt10, {backgroundColor: colors.gray2}]}>
            <ActivityIndicator />
          </View>
        ) : (
          <TouchableOpacity
            testID="editProfileSaveBtn"
            style={s.mt10}
            onPress={onPressSave}>
            <LinearGradient
              colors={[gradients.blueLight.start, gradients.blueLight.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.btn]}>
              <Text style={[s.white, s.bold]}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          testID="editProfileCancelBtn"
          style={s.mt5}
          onPress={onPressCancel}>
          <View style={[styles.btn]}>
            <Text style={[s.black, s.bold, pal.text]}>Cancel</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
  errorContainer: {marginTop: 20},
})
