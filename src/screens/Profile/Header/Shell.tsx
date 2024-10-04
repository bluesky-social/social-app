import React, {memo} from 'react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {AppBskyActorDefs, ModerationDecision} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {BACK_HITSLOP} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {NavigationProp} from '#/lib/routes/types'
import {isIOS} from '#/platform/detection'
import {Shadow} from '#/state/cache/types'
import {ProfileImageLightbox, useLightboxControls} from '#/state/lightbox'
import {useSession} from '#/state/session'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {UserBanner} from '#/view/com/util/UserBanner'
import {atoms as a, useTheme} from '#/alf'
import {LabelsOnMe} from '#/components/moderation/LabelsOnMe'
import {ProfileHeaderAlerts} from '#/components/moderation/ProfileHeaderAlerts'
import {GrowableAvatar} from './GrowableAvatar'
import {GrowableBanner} from './GrowableBanner'

interface Props {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}

let ProfileHeaderShell = ({
  children,
  profile,
  moderation,
  hideBackButton = false,
  isPlaceholderProfile,
}: React.PropsWithChildren<Props>): React.ReactNode => {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const {openLightbox} = useLightboxControls()
  const navigation = useNavigation<NavigationProp>()
  const {isDesktop} = useWebMediaQueries()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressAvi = React.useCallback(() => {
    const modui = moderation.ui('avatar')
    if (profile.avatar && !(modui.blur && modui.noOverride)) {
      openLightbox(new ProfileImageLightbox(profile))
    }
  }, [openLightbox, profile, moderation])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )

  return (
    <View style={t.atoms.bg} pointerEvents={isIOS ? 'auto' : 'box-none'}>
      <View
        pointerEvents={isIOS ? 'auto' : 'none'}
        style={[a.relative, {height: 150}]}>
        <GrowableBanner
          backButton={
            <>
              {!isDesktop && !hideBackButton && (
                <TouchableWithoutFeedback
                  testID="profileHeaderBackBtn"
                  onPress={onPressBack}
                  hitSlop={BACK_HITSLOP}
                  accessibilityRole="button"
                  accessibilityLabel={_(msg`Back`)}
                  accessibilityHint="">
                  <View style={styles.backBtnWrapper}>
                    <FontAwesomeIcon
                      size={18}
                      icon="angle-left"
                      color="white"
                    />
                  </View>
                </TouchableWithoutFeedback>
              )}
            </>
          }>
          {isPlaceholderProfile ? (
            <LoadingPlaceholder
              width="100%"
              height="100%"
              style={{borderRadius: 0}}
            />
          ) : (
            <UserBanner
              type={profile.associated?.labeler ? 'labeler' : 'default'}
              banner={profile.banner}
              moderation={moderation.ui('banner')}
            />
          )}
        </GrowableBanner>
      </View>

      {children}

      {!isPlaceholderProfile && (
        <View
          style={[a.px_lg, a.py_xs]}
          pointerEvents={isIOS ? 'auto' : 'box-none'}>
          {isMe ? (
            <LabelsOnMe type="account" labels={profile.labels} />
          ) : (
            <ProfileHeaderAlerts moderation={moderation} />
          )}
        </View>
      )}

      <GrowableAvatar style={styles.aviPosition}>
        <TouchableWithoutFeedback
          testID="profileHeaderAviButton"
          onPress={onPressAvi}
          accessibilityRole="image"
          accessibilityLabel={_(msg`View ${profile.handle}'s avatar`)}
          accessibilityHint="">
          <View
            style={[
              t.atoms.bg,
              {borderColor: t.atoms.bg.backgroundColor},
              styles.avi,
              profile.associated?.labeler && styles.aviLabeler,
            ]}>
            <UserAvatar
              type={profile.associated?.labeler ? 'labeler' : 'user'}
              size={90}
              avatar={profile.avatar}
              moderation={moderation.ui('avatar')}
            />
          </View>
        </TouchableWithoutFeedback>
      </GrowableAvatar>
    </View>
  )
}
ProfileHeaderShell = memo(ProfileHeaderShell)
export {ProfileHeaderShell}

const styles = StyleSheet.create({
  backBtnWrapper: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    overflow: 'hidden',
    borderRadius: 15,
    // @ts-ignore web only
    cursor: 'pointer',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aviPosition: {
    position: 'absolute',
    top: 110,
    left: 10,
  },
  avi: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
  },
  aviLabeler: {
    borderRadius: 10,
  },
})
