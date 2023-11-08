import React, {useState, useCallback} from 'react'
import * as Toast from '../util/Toast'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileModel} from 'state/models/content/profile'
import {s, colors, gradients} from 'lib/styles'
import {enforceLen} from 'lib/strings/helpers'
import {MAX_DISPLAY_NAME, MAX_DESCRIPTION} from 'lib/constants'
import {compressIfNeeded} from 'lib/media/manip'
import {UserBanner} from '../util/UserBanner'
import {EditableUserAvatar} from '../util/UserAvatar'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useAnalytics} from 'lib/analytics/analytics'
import {cleanError, isNetworkError} from 'lib/strings/errors'
import Animated, {FadeOut} from 'react-native-reanimated'
import {isWeb} from 'platform/detection'
import {useModalControls} from '#/state/modals'

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity)

export const snapPoints = ['fullscreen']

export function Component({
  profileView,
  onUpdate,
}: {
  profileView: ProfileModel
  onUpdate?: () => void
}) {
  const [error, setError] = useState<string>('')
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const {closeModal} = useModalControls()

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
    RNImage | undefined | null
  >()
  const [newUserAvatar, setNewUserAvatar] = useState<
    RNImage | undefined | null
  >()
  const onPressCancel = () => {
    closeModal()
  }
  const onSelectNewAvatar = useCallback(
    async (img: RNImage | null) => {
      if (img === null) {
        setNewUserAvatar(null)
        setUserAvatar(null)
        return
      }
      track('EditProfile:AvatarSelected')
      try {
        const finalImg = await compressIfNeeded(img, 1000000)
        setNewUserAvatar(finalImg)
        setUserAvatar(finalImg.path)
      } catch (e: any) {
        setError(cleanError(e))
      }
    },
    [track, setNewUserAvatar, setUserAvatar, setError],
  )

  const onSelectNewBanner = useCallback(
    async (img: RNImage | null) => {
      if (!img) {
        setNewUserBanner(null)
        setUserBanner(null)
        return
      }
      track('EditProfile:BannerSelected')
      try {
        const finalImg = await compressIfNeeded(img, 1000000)
        setNewUserBanner(finalImg)
        setUserBanner(finalImg.path)
      } catch (e: any) {
        setError(cleanError(e))
      }
    },
    [track, setNewUserBanner, setUserBanner, setError],
  )

  const onPressSave = useCallback(async () => {
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
      closeModal()
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
  }, [
    track,
    setProcessing,
    setError,
    error,
    profileView,
    onUpdate,
    closeModal,
    displayName,
    description,
    newUserAvatar,
    newUserBanner,
  ])

  return (
    <KeyboardAvoidingView style={s.flex1} behavior="height">
      <ScrollView style={[pal.view]} testID="editProfileModal">
        <Text style={[styles.title, pal.text]}>Edit my profile</Text>
        <View style={styles.photos}>
          <UserBanner
            banner={userBanner}
            onSelectNewBanner={onSelectNewBanner}
          />
          <View style={[styles.avi, {borderColor: pal.colors.background}]}>
            <EditableUserAvatar
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
        <View style={styles.form}>
          <View>
            <Text style={[styles.label, pal.text]}>Display Name</Text>
            <TextInput
              testID="editProfileDisplayNameInput"
              style={[styles.textInput, pal.border, pal.text]}
              placeholder="e.g. Alice Roberts"
              placeholderTextColor={colors.gray4}
              value={displayName}
              onChangeText={v =>
                setDisplayName(enforceLen(v, MAX_DISPLAY_NAME))
              }
              accessible={true}
              accessibilityLabel="Display name"
              accessibilityHint="Edit your display name"
            />
          </View>
          <View style={s.pb10}>
            <Text style={[styles.label, pal.text]}>Description</Text>
            <TextInput
              testID="editProfileDescriptionInput"
              style={[styles.textArea, pal.border, pal.text]}
              placeholder="e.g. Artist, dog-lover, and avid reader."
              placeholderTextColor={colors.gray4}
              keyboardAppearance={theme.colorScheme}
              multiline
              value={description}
              onChangeText={v => setDescription(enforceLen(v, MAX_DESCRIPTION))}
              accessible={true}
              accessibilityLabel="Description"
              accessibilityHint="Edit your profile description"
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
              onPress={onPressSave}
              accessibilityRole="button"
              accessibilityLabel="Save"
              accessibilityHint="Saves any changes to your profile">
              <LinearGradient
                colors={[gradients.blueLight.start, gradients.blueLight.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.btn]}>
                <Text style={[s.white, s.bold]}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {!isProcessing && (
            <AnimatedTouchableOpacity
              exiting={!isWeb ? FadeOut : undefined}
              testID="editProfileCancelBtn"
              style={s.mt5}
              onPress={onPressCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel profile editing"
              accessibilityHint=""
              onAccessibilityEscape={onPressCancel}>
              <View style={[styles.btn]}>
                <Text style={[s.black, s.bold, pal.text]}>Cancel</Text>
              </View>
            </AnimatedTouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
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
  form: {
    paddingHorizontal: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 16,
    height: 120,
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
    left: 24,
    width: 84,
    height: 84,
    borderWidth: 2,
    borderRadius: 42,
  },
  photos: {
    marginBottom: 36,
    marginHorizontal: -14,
  },
  errorContainer: {marginTop: 20},
})
