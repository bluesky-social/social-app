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
import {RQKEY} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CustomLinkWarningDialog} from '#/components/dialogs/LinkWarning'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function GermButton({
  germ,
  profile,
}: {
  germ: AppBskyActorDefs.ProfileAssociatedGerm
  profile: bsky.profile.AnyProfileView
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const linkWarningControl = Dialog.useDialogControl()

  // exclude `none` and all unknown values
  if (
    !(germ.showButtonTo === 'everyone' || germ.showButtonTo === 'usersIFollow')
  ) {
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
    <>
      <Link
        to={url}
        onPress={evt => {
          ax.metric('profile:associated:germ:click-to-chat', {})
          if (isCustomGermDomain(url)) {
            evt.preventDefault()
            linkWarningControl.open()
            return false
          }
        }}
        label={_(msg`Open Germ DM`)}
        overridePresentation={false}
        shouldProxy={false}
        style={[
          t.atoms.bg_contrast_50,
          a.rounded_full,
          a.self_start,
          {padding: 6},
        ]}>
        <GermLogo size="small" />
        <Text style={[a.text_sm, a.font_medium, a.ml_xs]}>
          <Trans>Germ DM</Trans>
        </Text>
        <ArrowTopRightIcon style={[t.atoms.text, a.mx_2xs]} width={14} />
      </Link>
      <CustomLinkWarningDialog
        control={linkWarningControl}
        link={{
          href: url,
          displayText: '',
          share: false,
        }}
      />
    </>
  )
}

function GermLogo({size}: {size: 'small' | 'large'}) {
  return (
    <Image
      source={require('../../../../assets/images/germ_logo.webp')}
      accessibilityIgnoresInvertColors={false}
      contentFit="cover"
      style={[
        a.rounded_full,
        size === 'large' ? {width: 32, height: 32} : {width: 16, height: 16},
      ]}
    />
  )
}

function GermSelfButton({did}: {did: string}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const selfExplanationDialogControl = Dialog.useDialogControl()
  const agent = useAgent()
  const queryClient = useQueryClient()

  const {mutate: deleteDeclaration, isPending} = useMutation({
    mutationFn: async () => {
      const previousRecord = await agent.com.germnetwork.declaration
        .get({
          repo: did,
          rkey: 'self',
        })
        .then(res => res.value)
        .catch(() => null)

      await agent.com.germnetwork.declaration.delete({
        repo: did,
        rkey: 'self',
      })

      await whenAppViewReady(agent, did, res => !res.data.associated?.germ)

      return previousRecord
    },
    onSuccess: previousRecord => {
      ax.metric('profile:associated:germ:self-disconnect', {})

      async function undo() {
        if (!previousRecord) return
        try {
          await agent.com.germnetwork.declaration.put(
            {
              repo: did,
              rkey: 'self',
            },
            previousRecord,
          )
          await whenAppViewReady(agent, did, res => !!res.data.associated?.germ)
          await queryClient.refetchQueries({queryKey: RQKEY(did)})

          Toast.show(_(msg`Germ DM reconnected`))
          ax.metric('profile:associated:germ:self-reconnect', {})
        } catch (e: any) {
          Toast.show(
            _(msg`Failed to reconnect Germ DM. Error: ${e?.message}`),
            {
              type: 'error',
            },
          )
          if (!isNetworkError(e)) {
            ax.logger.error('Failed to reconnect Germ DM link', {
              safeMessage: e,
            })
          }
        }
      }

      selfExplanationDialogControl.close(() => {
        void queryClient.refetchQueries({queryKey: RQKEY(did)})
        Toast.show(
          <Toast.Outer>
            <Toast.Icon />
            <Toast.Text>
              <Trans>Germ DM disconnected</Trans>
            </Toast.Text>
            {previousRecord && (
              <Toast.Action label={_(msg`Undo`)} onPress={() => void undo()}>
                <Trans>Undo</Trans>
              </Toast.Action>
            )}
          </Toast.Outer>,
        )
      })
    },
    onError: error => {
      Toast.show(
        _(msg`Failed to disconnect Germ DM. Error: ${error?.message}`),
        {
          type: 'error',
        },
      )
      if (!isNetworkError(error)) {
        ax.logger.error('Failed to disconnect Germ DM link', {
          safeMessage: error,
        })
      }
    },
  })

  return (
    <>
      <Button
        label={_(msg`Learn more about your Germ DM link`)}
        onPress={() => {
          ax.metric('profile:associated:germ:click-self-info', {})
          selfExplanationDialogControl.open()
        }}
        style={[
          t.atoms.bg_contrast_50,
          a.rounded_full,
          a.self_start,
          {padding: 6, paddingRight: 10},
        ]}>
        <GermLogo size="small" />
        <Text style={[a.text_sm, a.font_medium, a.ml_xs]}>
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
              This button lets others open the Germ DM app to send you a
              message. You can manage its visibility from the Germ DM app, or
              you can disconnect your Bluesky account from Germ DM altogether by
              clicking the button below.
            </Trans>
          </Text>
          <View style={[a.mt_2xl, a.gap_md]}>
            <Button
              label={_(msg`Got it`)}
              size="large"
              color="primary"
              onPress={() => selfExplanationDialogControl.close()}>
              <ButtonText>
                <Trans>Got it</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_(msg`Disconnect Germ DM`)}
              size="large"
              color="secondary"
              onPress={() => deleteDeclaration()}
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

function isCustomGermDomain(url: string) {
  try {
    const urlp = new URL(url)
    return urlp.hostname !== 'landing.ger.mx'
  } catch {
    return false
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
