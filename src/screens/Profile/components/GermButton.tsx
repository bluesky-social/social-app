import {Platform, View} from 'react-native'
import {Image} from 'expo-image'
import {
  type AppBskyActorDefs,
  type AppBskyActorGetProfile,
  type AtpAgent,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {RQKEY} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function GermButton({
  germ,
  profile,
}: {
  germ: AppBskyActorDefs.ProfileAssociatedGerm
  profile: bsky.profile.AnyProfileView
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  if (germ.showButtonTo === 'none') {
    return null
  }

  if (currentAccount?.did === profile.did) {
    return <GermSelfButton did={currentAccount.did} />
  }

  if (germ.showButtonTo === 'usersIFollow' && !profile.viewer?.followedBy) {
    return null
  }

  const url = constructGermUrl(germ, profile, currentAccount?.did)

  if (!url) {
    return null
  }

  return (
    <Link
      to={url}
      label={_(msg`Open Germ DM`)}
      style={[t.atoms.bg_contrast_50, a.rounded_full, a.gap_xs, {padding: 6}]}>
      <GermLogo size="small" />
      <Text style={[a.text_sm, a.font_medium]}>
        <Trans>Germ DM</Trans>
      </Text>
      <ArrowTopRightIcon style={[t.atoms.text]} size="sm" />
    </Link>
  )
}

function GermLogo({size}: {size: 'small' | 'large'}) {
  return (
    <Image
      source={require('../../../../assets/images/germ_logo.webp')}
      accessibilityIgnoresInvertColors={false}
      contentFit="cover"
      style={[
        size === 'large' ? {width: 32, height: 32} : {width: 16, height: 16},
      ]}
    />
  )
}

function GermSelfButton({did}: {did: string}) {
  const {_} = useLingui()
  const selfExplanationDialogControl = Dialog.useDialogControl()
  const agent = useAgent()
  const t = useTheme()
  const queryClient = useQueryClient()

  const {mutate, isPending} = useMutation({
    onMutate: async () => {
      await agent.com.germnetwork.declaration.delete({
        repo: did,
        rkey: 'self',
      })

      await whenAppViewReady(agent, did, res => !res.data.associated?.germ)
    },
    onSuccess: () => {
      selfExplanationDialogControl.close(() => {
        Toast.show(
          _(
            msg`Germ DM link disconnected. You can reconnect it at any time through the Germ app.`,
          ),
        )
        void queryClient.refetchQueries({queryKey: RQKEY(did)})
      })
    },
    onError: error => {
      Toast.show(
        _(msg`Failed to remove Germ DM link. Error: ${error?.message}`),
      )
      if (!isNetworkError(error)) {
        logger.error('Failed to remove Germ DM link', {safeMessage: error})
      }
    },
  })

  return (
    <>
      <Button
        label={_(msg`Learn more about your Germ DM link`)}
        onPress={selfExplanationDialogControl.open}
        style={[
          t.atoms.bg_contrast_50,
          a.rounded_full,
          a.gap_xs,
          {padding: 6},
        ]}>
        <GermLogo size="small" />
        <Text style={[a.text_sm, a.font_medium]}>
          <Trans>Germ DM</Trans>
        </Text>
      </Button>

      <Dialog.Outer
        control={selfExplanationDialogControl}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Germ DM Link`)}
          style={web([{maxWidth: 400, borderRadius: 36}])}>
          <View style={[a.flex_row, a.align_center, {gap: 6}]}>
            <GermLogo size="large" />
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Germ DM Link</Trans>
            </Text>
          </View>

          <Text style={[a.text_md, a.leading_snug, a.mt_sm]}>
            <Trans>
              This button lets others send you a message on the Germ DM app. You
              can manage its visibility from the Germ DM app.
            </Trans>
          </Text>
          <View style={[a.mt_2xl]}>
            <Button
              label={_(msg``)}
              size="large"
              color="primary"
              onPress={() => selfExplanationDialogControl.close()}>
              <ButtonText>
                <Trans>Got it!</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_(msg`Disconnect Germ DM`)}
              size="large"
              color="primary"
              onPress={() => mutate()}
              disabled={isPending}>
              {isPending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Disconnect Germ DM</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

function constructGermUrl(
  declaration: AppBskyActorDefs.ProfileAssociatedGerm,
  profile: bsky.profile.AnyProfileView,
  viewerDid?: string,
) {
  try {
    const urlp = new URL(declaration.messageMeUrl)

    if (urlp.pathname.endsWith('/')) {
      urlp.pathname = urlp.pathname.slice(0, -1)
    }

    urlp.pathname += `/${platform()}`

    if (viewerDid) {
      urlp.hash = `#${profile.did}+${viewerDid}`
    } else {
      urlp.hash = `#${profile.did}`
    }

    return urlp.toString()
  } catch {
    return null
  }
}

function platform() {
  switch (Platform.OS) {
    case 'ios':
      return 'iOS'
    case 'android':
      return 'android'
    default:
      return 'web'
  }
}

async function whenAppViewReady(
  agent: AtpAgent,
  actor: string,
  fn: (res: AppBskyActorGetProfile.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () => agent.app.bsky.actor.getProfile({actor}),
  )
}
