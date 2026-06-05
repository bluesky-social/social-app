import {Suspense, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import type ViewShot from 'react-native-view-shot'
import {setStringAsync} from 'expo-clipboard'
import {createAssetAsync, requestPermissionsAsync} from 'expo-media-library'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl as nativeShareUrl} from '#/lib/sharing'
import {logger} from '#/logger'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Error as ErrorMessage} from '#/components/Error'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {ActionButtons} from './components/ActionButtons'
import {ThemedQrCard} from './components/ThemedQrCard'
import {ThemePicker} from './components/ThemePicker'
import {getInviteTheme, type InviteThemeKey} from './themes'
import {getInviteDisplayUrl, getInviteShareUrl} from './urls'

export function InviteFriendsDialogInner({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const profileQuery = useProfileQuery({did: currentAccount?.did})
  const [themeKey, setThemeKey] = useState<InviteThemeKey>('day')
  const captureRef = useRef<ViewShot>(null)

  const theme = getInviteTheme(themeKey)
  const variant = t.name === 'light' ? theme.light : theme.dark

  const handle = profileQuery.data?.handle
  const avatarUri = profileQuery.data?.avatar

  // 'handle.invalid' is the atproto sentinel for an unresolvable DID - treat
  // it like a load error so we don't display a broken share URL.
  const isHandleValid = !!handle && handle !== 'handle.invalid'

  const canonicalShareUrl = isHandleValid ? getInviteShareUrl(handle) : ''
  const displayUrl = isHandleValid ? getInviteDisplayUrl(handle) : ''

  const onShare = async () => {
    if (!canonicalShareUrl) {
      Toast.show(l`Could not share - please try again`, {type: 'error'})
      return
    }
    ax.metric('invite:action:share', {})
    try {
      await nativeShareUrl(canonicalShareUrl)
    } catch (err) {
      logger.error('InviteFriendsDialog: share failed', {safeMessage: err})
    }
  }

  const onDownload = async () => {
    if (!IS_NATIVE) return
    if (!canonicalShareUrl) {
      Toast.show(l`Could not download - please try again`, {type: 'error'})
      return
    }
    const uri = await captureRef.current?.capture?.()
    if (!uri) {
      Toast.show(l`Could not capture QR code`, {type: 'error'})
      return
    }

    // Write-only permission - saving the QR image does not require read access
    // to the user's photo library.
    const permission = await requestPermissionsAsync(true)
    if (!permission.granted) {
      Toast.show(
        l`You must grant access to your photo library to save the QR code`,
        {type: 'error'},
      )
      return
    }

    try {
      await createAssetAsync(`file://${uri}`)
      ax.metric('invite:action:download', {})
      Toast.show(l`QR code saved to your camera roll`)
    } catch (err) {
      logger.error('InviteFriendsDialog: download failed', {safeMessage: err})
      Toast.show(l`Could not save QR code`, {type: 'error'})
    }
  }

  const onScan = () => {
    ax.metric('invite:action:scan', {})
    // Close dialog first, then navigate (control.close callback per CLAUDE.md
    // Dialog footgun rule — prevents race with the navigation push).
    control.close(() => {
      navigation.navigate('InviteScanner')
    })
  }

  const onCopy = async () => {
    if (!canonicalShareUrl) {
      Toast.show(l`Could not copy - please try again`, {type: 'error'})
      return
    }
    try {
      await setStringAsync(canonicalShareUrl)
      ax.metric('invite:action:copy', {})
      Toast.show(l`Invite link copied`)
    } catch (err) {
      logger.error('InviteFriendsDialog: copy failed', {safeMessage: err})
      Toast.show(l`Could not copy link`, {type: 'error'})
    }
  }

  const onThemeChange = (next: InviteThemeKey) => {
    ax.metric('invite:theme:change', {themeKey: next})
    setThemeKey(next)
  }

  return (
    <Dialog.ScrollableInner
      label={l`Invite friends`}
      contentContainerStyle={[a.pt_0, a.px_0]}
      header={
        <Dialog.Header
          renderLeft={() => (
            <Button
              label={l`Done`}
              onPress={() => control.close()}
              size="small"
              color="primary"
              variant="ghost"
              style={[a.rounded_full]}>
              <ButtonText style={[a.text_md]}>{l`Done`}</ButtonText>
            </Button>
          )}>
          <Dialog.HeaderText>{l`Invite Friends`}</Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.align_center, a.pt_xl, a.px_xl]}>
        <ThemePicker value={themeKey} onChange={onThemeChange} />

        <View style={[a.mt_5xl]}>
          {profileQuery.isLoading ? (
            <View style={[a.align_center, a.justify_center, {minHeight: 360}]}>
              <Loader size="xl" />
            </View>
          ) : profileQuery.error || !isHandleValid ? (
            <View style={[a.w_full, {minHeight: 360}]}>
              <ErrorMessage
                title={l`Could not load profile`}
                message={l`Try again in a moment.`}
                onRetry={() => profileQuery.refetch()}
                hideBackButton
              />
            </View>
          ) : (
            <Suspense
              fallback={
                <View
                  style={[a.align_center, a.justify_center, {minHeight: 360}]}>
                  <Loader size="xl" />
                </View>
              }>
              <ThemedQrCard
                variant={variant}
                shareUrl={canonicalShareUrl}
                handle={handle ?? ''}
                avatarUri={avatarUri}
                captureRef={captureRef}
              />
            </Suspense>
          )}
        </View>

        <View style={[a.w_full, {marginTop: 48}]}>
          <ActionButtons
            onShare={onShare}
            onDownload={onDownload}
            onScan={onScan}
          />
        </View>

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_center,
            a.w_full,
            a.mt_4xl,
            {gap: 24},
          ]}>
          <Divider style={[a.flex_1]} />
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {l`Invite link`}
          </Text>
          <Divider style={[a.flex_1]} />
        </View>

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.w_full,
            a.mt_4xl,
            {
              height: 44,
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 11,
              borderRadius: 10,
              backgroundColor: t.palette.contrast_50,
            },
          ]}>
          <ChainLinkIcon
            width={20}
            height={20}
            fill={t.atoms.text_contrast_medium.color}
          />
          <Text
            style={[
              a.flex_1,
              a.text_md,
              {color: t.palette.contrast_975, lineHeight: 19.5},
            ]}
            numberOfLines={1}>
            {displayUrl || ' '}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={l`Copy invite link`}
            accessibilityHint={l`Copies the canonical profile URL to the clipboard`}
            onPress={onCopy}
            hitSlop={8}
            style={({pressed}) => [{opacity: pressed ? 0.7 : 1}]}>
            <Text
              style={[
                a.text_md,
                a.font_semi_bold,
                {color: t.palette.primary_500, lineHeight: 19.5},
              ]}>
              {l`Copy`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
