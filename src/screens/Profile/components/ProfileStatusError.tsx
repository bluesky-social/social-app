import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type ProfileErrorKind,
  type ProfileStatusSource,
  useProfileStatusSource,
} from '#/state/queries/profile-status'
import {atoms as a, useTheme} from '#/alf'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ProfileStatusError({
  kind,
  didOrHandle,
  did,
}: {
  kind: Exclude<ProfileErrorKind, 'unknown'>
  /** The identifier the user typed (handle, did, or 'me'-resolved did) — shown in messages */
  didOrHandle: string
  /** The DID, when known — used to look up which labeler suspended the account */
  did?: string
}) {
  const {_} = useLingui()
  const enableSourceLookup = kind === 'suspendedOrTakedown' && !!did
  const {data: source, isLoading: isSourceLoading} = useProfileStatusSource(
    did,
    {enabled: enableSourceLookup},
  )

  let title: string
  let body: React.ReactNode
  switch (kind) {
    case 'notFound':
      title = _(msg`Not found`)
      body = (
        <Text style={[a.text_center, a.text_md]}>
          <Trans>We couldn't find an account at {didOrHandle}.</Trans>
        </Text>
      )
      break
    case 'deactivated':
      title = _(msg`Account deactivated`)
      body = (
        <Text style={[a.text_center, a.text_md]}>
          <Trans>This account has been deactivated by its owner.</Trans>
        </Text>
      )
      break
    case 'suspendedOrTakedown':
      title = _(msg`Account suspended`)
      if (isSourceLoading) {
        body = (
          <View
            style={[a.flex_row, a.align_center, a.justify_center, a.gap_sm]}>
            <Loader size="sm" />
            <Text style={[a.text_md]}>
              <Trans>Account is suspended.</Trans>
            </Text>
          </View>
        )
      } else if (source && (source.appealUrl || source.email)) {
        body = <SuspendedMessage source={source} />
      } else if (source) {
        body = (
          <Text style={[a.text_center, a.text_md]}>
            <Trans>Account is suspended by @{source.handle}.</Trans>
          </Text>
        )
      } else {
        body = (
          <Text style={[a.text_center, a.text_md]}>
            <Trans>Account is suspended.</Trans>
          </Text>
        )
      }
      break
  }

  return <ProfileStatusErrorShell title={title}>{body}</ProfileStatusErrorShell>
}

function SuspendedMessage({source}: {source: ProfileStatusSource}) {
  if (source.appealUrl) {
    return (
      <Text style={[a.text_center, a.text_md]}>
        <Trans>
          Account is suspended by{' '}
          <InlineLinkText
            label={`@${source.handle}`}
            to={{screen: 'Profile', params: {name: source.handle}}}>
            @{source.handle}
          </InlineLinkText>
          . Click{' '}
          <InlineLinkText
            label="Submit an appeal"
            to={source.appealUrl}
            overridePresentation>
            here
          </InlineLinkText>{' '}
          to submit an appeal.
        </Trans>
      </Text>
    )
  }
  return (
    <Text style={[a.text_center, a.text_md]}>
      <Trans>
        Account is suspended by{' '}
        <InlineLinkText
          label={`@${source.handle}`}
          to={{screen: 'Profile', params: {name: source.handle}}}>
          @{source.handle}
        </InlineLinkText>
        , email{' '}
        <InlineLinkText label={source.email} to={`mailto:${source.email}`}>
          {source.email}
        </InlineLinkText>{' '}
        to appeal.
      </Trans>
    </Text>
  )
}

function ProfileStatusErrorShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <Layout.Center testID="profileStatusErrorScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Profile</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <View style={[a.px_xl, a.py_2xl]}>
        <View style={[a.mb_md, a.align_center]}>
          <View
            style={[
              a.rounded_full,
              {width: 50, height: 50},
              a.align_center,
              a.justify_center,
              {backgroundColor: t.palette.contrast_950},
            ]}>
            <Warning size="lg" fill={t.palette.white} />
          </View>
        </View>
        <Text style={[a.text_center, a.font_bold, a.text_2xl, a.mb_md]}>
          {title}
        </Text>
        <View style={[a.align_center]}>{children}</View>
      </View>
    </Layout.Center>
  )
}
