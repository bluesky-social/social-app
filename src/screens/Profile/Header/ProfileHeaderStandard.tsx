import React, {memo, useMemo} from 'react'
import {Modal, Pressable,View} from 'react-native'
// @ts-expect-error missing types
import QRCodeStyled from 'react-native-qrcode-styled'
import {
  AppBskyActorDefs,
  moderateProfile,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {logger} from '#/logger'
import {isIOS, isWeb} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {Shadow} from '#/state/cache/types'
import {useModalControls} from '#/state/modals'
import {
  useProfileBlockMutationQueue,
  useProfileFollowMutationQueue,
} from '#/state/queries/profile'
import {useRequireAuth, useSession} from '#/state/session'
import {ProfileMenu} from '#/view/com/profile/ProfileMenu'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {MessageProfileButton} from '#/components/dms/MessageProfileButton'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {
  KnownFollowers,
  shouldShowKnownFollowers,
} from '#/components/KnownFollowers'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {ProfileHeaderDisplayName} from './DisplayName'
import {EditProfileDialog} from './EditProfileDialog'
import {ProfileHeaderHandle} from './Handle'
import {ProfileHeaderMetrics} from './Metrics'
import {ProfileHeaderShell} from './Shell'
interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}
let ProfileHeaderStandard = ({
  profile: profileUnshadowed,
  descriptionRT,
  moderationOpts,
  hideBackButton = false,
  isPlaceholderProfile,
}: Props): React.ReactNode => {
  const profile: Shadow<AppBskyActorDefs.ProfileViewDetailed> =
    useProfileShadow(profileUnshadowed)
  const {currentAccount, hasSession} = useSession()
  const {_} = useLingui()
  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ProfileHeader',
  )
  const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const unblockPromptControl = Prompt.usePromptControl()
  const requireAuth = useRequireAuth()
  const isBlockedUser =
    profile.viewer?.blocking ||
    profile.viewer?.blockedBy ||
    profile.viewer?.blockingByList

  const {openModal} = useModalControls()
  const editProfileControl = useDialogControl()
  const onPressEditProfile = React.useCallback(() => {
    if (isWeb) {
      // temp, while we figure out the nested dialog bug
      openModal({
        name: 'edit-profile',
        profile,
      })
    } else {
      editProfileControl.open()
    }
  }, [editProfileControl, openModal, profile])

  const onPressFollow = () => {
    requireAuth(async () => {
      try {
        await queueFollow()
        Toast.show(
          _(
            msg`Following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to follow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    })
  }

  const onPressUnfollow = () => {
    requireAuth(async () => {
      try {
        await queueUnfollow()
        Toast.show(
          _(
            msg`No longer following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unfollow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    })
  }

  const unblockAccount = React.useCallback(async () => {
    try {
      await queueUnblock()
      Toast.show(_(msg`Account unblocked`))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to unblock account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
      }
    }
  }, [_, queueUnblock])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )
  const [qrModalVisible, setQRModalVisible] = React.useState(false)

  const setQRModalVisibleTrue = () => {
    setQRModalVisible(true)
  }
  return (
    <ProfileHeaderShell
      profile={profile}
      moderation={moderation}
      hideBackButton={hideBackButton}
      isPlaceholderProfile={isPlaceholderProfile}>
      <View
        style={[a.px_lg, a.pt_md, a.pb_sm, a.overflow_hidden]}
        pointerEvents={isIOS ? 'auto' : 'box-none'}>
        <View
          style={[
            {paddingLeft: 90},
            a.flex_row,
            a.align_center,
            a.justify_end,
            a.gap_xs,
            a.pb_sm,
            a.flex_wrap,
          ]}
          pointerEvents={isIOS ? 'auto' : 'box-none'}>
          {isMe ? (
            <>
              <Button
                testID="profileHeaderEditProfileButton"
                size="small"
                color="secondary"
                variant="solid"
                onPress={onPressEditProfile}
                label={_(msg`Edit profile`)}
                style={[a.rounded_full]}>
                <ButtonText>
                  <Trans>Edit Profile</Trans>
                </ButtonText>
              </Button>
              <EditProfileDialog
                profile={profile}
                control={editProfileControl}
              />
            </>
          ) : profile.viewer?.blocking ? (
            profile.viewer?.blockingByList ? null : (
              <Button
                testID="unblockBtn"
                size="small"
                color="secondary"
                variant="solid"
                label={_(msg`Unblock`)}
                disabled={!hasSession}
                onPress={() => unblockPromptControl.open()}
                style={[a.rounded_full]}>
                <ButtonText>
                  <Trans context="action">Unblock</Trans>
                </ButtonText>
              </Button>
            )
          ) : !profile.viewer?.blockedBy ? (
            <>
              {hasSession && <MessageProfileButton profile={profile} />}

              <Button
                testID={profile.viewer?.following ? 'unfollowBtn' : 'followBtn'}
                size="small"
                color={profile.viewer?.following ? 'secondary' : 'primary'}
                variant="solid"
                label={
                  profile.viewer?.following
                    ? _(msg`Unfollow ${profile.handle}`)
                    : _(msg`Follow ${profile.handle}`)
                }
                onPress={
                  profile.viewer?.following ? onPressUnfollow : onPressFollow
                }
                style={[a.rounded_full]}>
                <ButtonIcon
                  position="left"
                  icon={profile.viewer?.following ? Check : Plus}
                />
                <ButtonText>
                  {profile.viewer?.following ? (
                    <Trans>Following</Trans>
                  ) : profile.viewer?.followedBy ? (
                    <Trans>Follow Back</Trans>
                  ) : (
                    <Trans>Follow</Trans>
                  )}
                </ButtonText>
              </Button>
            </>
          ) : null}
          <ProfileMenu profile={profile} />
        </View>

        <View
          style={{
            alignSelf: 'flex-end', // Align the view to the end of its parent container
            borderWidth: 2,
            padding: 0, // Ensure no extra padding
            margin: 0, // Ensure no extra margin
          }}>
          <Button
            label={'Generate QR'}
            onPress={setQRModalVisibleTrue}
            size="small" // Add size if needed
            color="secondary" // Add color
            variant="solid" // Add variant
            style={[a.rounded_full]} // Apply the same rounded style
          >
            <ButtonText>
              <Trans>Generate QR</Trans>
            </ButtonText>
          </Button>
        </View>

        <QRCodeModal
          profile_={profile}
          visible={qrModalVisible}
          setVisible={setQRModalVisible}
        />

        <View style={[a.flex_col, a.gap_2xs, a.pt_2xs, a.pb_sm]}>
          <ProfileHeaderDisplayName profile={profile} moderation={moderation} />
          <ProfileHeaderHandle profile={profile} />
        </View>
        {!isPlaceholderProfile && !isBlockedUser && (
          <View style={a.gap_md}>
            <ProfileHeaderMetrics profile={profile} />
            {descriptionRT && !moderation.ui('profileView').blur ? (
              <View pointerEvents="auto">
                <RichText
                  testID="profileHeaderDescription"
                  style={[a.text_md]}
                  numberOfLines={15}
                  value={descriptionRT}
                  enableTags
                  authorHandle={profile.handle}
                />
              </View>
            ) : undefined}

            {!isMe &&
              !isBlockedUser &&
              shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
                <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <KnownFollowers
                    profile={profile}
                    moderationOpts={moderationOpts}
                  />
                </View>
              )}
          </View>
        )}
      </View>
      <Prompt.Basic
        control={unblockPromptControl}
        title={_(msg`Unblock Account?`)}
        description={_(
          msg`The account will be able to interact with you after unblocking.`,
        )}
        onConfirm={unblockAccount}
        confirmButtonCta={
          profile.viewer?.blocking ? _(msg`Unblock`) : _(msg`Block`)
        }
        confirmButtonColor="negative"
      />
    </ProfileHeaderShell>
  )
}
ProfileHeaderStandard = memo(ProfileHeaderStandard)
export {ProfileHeaderStandard}

interface QRCodeModalProps {
  profile_: AppBskyActorDefs.ProfileViewDetailed // Define the type of profile
  visible: boolean // Receive the visibility status as a prop
  setVisible: (visible: boolean) => void // Receive the function to set visibility as a prop
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  profile_,
  visible,
  setVisible,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setVisible(false)} // Close modal when back button is pressed (for Android)
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        }}>
        <View
          style={{
            justifyContent: 'center', // Center QR code horizontally
            alignItems: 'center', // Center QR code vertically
            backgroundColor: 'white', // Set the background color
            padding: 20, // Add padding to give space around QR code
            borderRadius: 10, // Optional: round the corners of the modal content
          }}>
          <QRCodeStyled
            data={`https://bsky.app/${makeProfileLink(profile_)}`}
            style={{width: 200, height: 200}} // Larger QR code
            padding={20}
            pieceSize={10} // Larger pieces for clearer QR code
          />
        </View>

        {/* Pressable to close the modal */}
        <Pressable accessibilityRole="button"
          onPress={() => setVisible(false)}
          style={{
            marginTop: 20,
            backgroundColor: 'transparent',
            padding: 10,
            borderRadius: 5,
            borderColor: 'white',
            borderWidth: 1,
          }}>
          <ButtonText>
            <Trans style={{color: 'white', fontSize: 16}}>Close</Trans>
          </ButtonText>
        </Pressable>
      </View>
    </Modal>
  )
}
