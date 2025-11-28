import {useMemo, useState} from 'react'
import {View} from 'react-native'
import * as SMS from 'expo-sms'
import {type ModerationOpts} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {SearchInput} from '#/components/forms/SearchInput'
import {Envelope_Stroke2_Corner0_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {type Action, type Contact, type State} from '../state'

type Item =
  | {
      type: 'matches header'
    }
  | {
      type: 'match'
      profile: bsky.profile.AnyProfileView
    }
  | {
      type: 'contacts header'
    }
  | {
      type: 'contact'
      contact: Contact
    }
  | {
      type: 'no matches header'
    }
  | {
      type: 'search empty state'
    }
// we could use Contacts.presentAccessPickerAsync() if we get limited permissions?
// | {
//     type: 'request more contacts'
//   }

export function ViewMatches({
  state,
}: {
  state: Extract<State, {step: '4: view matches'}>
  dispatch: React.Dispatch<Action>
}) {
  const {_} = useLingui()
  const gutter = useGutters([0, 'wide'])
  const moderationOpts = useModerationOpts()

  const [search, setSearch] = useState('')

  const items = useMemo(() => {
    const all: Item[] = []

    if (state.matches.length > 0) {
      all.push({type: 'matches header'})
      for (const match of state.matches) {
        const profile = match.profile
        all.push({type: 'match', profile})
      }
      all.push({type: 'contacts header'})
    } else {
      all.push({type: 'no matches header'})
    }

    for (const contact of state.contacts) {
      all.push({type: 'contact', contact})
    }

    return all
  }, [state.matches, state.contacts])

  const numMatches = state.matches.length

  const renderItem = ({item}: {item: Item}) => {
    switch (item.type) {
      case 'match':
        return (
          <MatchItem profile={item.profile} moderationOpts={moderationOpts} />
        )
      case 'contact':
        return <ContactItem contact={item.contact} />
      case 'matches header':
        return (
          <Header
            titleText={
              <Plural
                value={numMatches}
                one="# friend found!"
                other="# friends found!"
              />
            }>
            {numMatches > 1 && (
              <Button
                label={_(msg`Follow all`)}
                size="small"
                color="primary_subtle">
                <ButtonIcon icon={PlusIcon} />
                <ButtonText>
                  <Trans>Follow all</Trans>
                </ButtonText>
              </Button>
            )}
          </Header>
        )
      case 'contacts header':
        return <Header titleText={_(msg`Invite friends`)} hasContentAbove />
      case 'no matches header':
        return (
          <Header
            titleText={_(msg`You got here first`)}
            subtitleText={_(
              msg`Bluesky is more fun with friends. Do you want to invite some of yours?`,
            )}
          />
        )
      case 'search empty state':
        return null
    }
  }

  return (
    <View style={[a.h_full]}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content />
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <View style={[gutter, a.mb_xs]}>
        <SearchInput
          placeholder={_(msg`Search contacts`)}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <List
        data={items}
        renderItem={renderItem}
        ListFooterComponent={<ListFooter />}
      />
    </View>
  )
}

function MatchItem({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts?: ModerationOpts
}) {
  const gutter = useGutters([0, 'wide'])
  const t = useTheme()

  if (!moderationOpts) return null

  return (
    <View style={[gutter, a.py_md, a.border_t, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
        <ProfileCard.NameAndHandle
          profile={profile}
          moderationOpts={moderationOpts}
        />
        <ProfileCard.FollowButton
          profile={profile}
          moderationOpts={moderationOpts}
          logContext="SyncContacts"
        />
      </ProfileCard.Header>
    </View>
  )
}

function ContactItem({contact}: {contact: Contact}) {
  const gutter = useGutters([0, 'wide'])
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()

  const name = contact.firstName ?? contact.lastName
  const phone =
    contact.phoneNumbers?.find(phone => phone.isPrimary) ??
    contact.phoneNumbers?.[0]
  const phoneNumber = phone?.number

  return (
    <View style={[gutter, a.py_md, a.border_t, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        {contact.image ? (
          <UserAvatar size={40} avatar={contact.image.uri} type="user" />
        ) : (
          <View
            style={[
              {width: 40, height: 40},
              a.rounded_full,
              a.justify_center,
              a.align_center,
              t.atoms.bg_contrast_400,
            ]}>
            <Text
              style={[
                a.text_lg,
                a.font_semi_bold,
                {color: t.palette.contrast_0},
              ]}>
              {name?.[0]?.toLocaleUpperCase()}
            </Text>
          </View>
        )}
        <Text
          style={[
            a.flex_1,
            a.text_md,
            a.font_medium,
            !name && [t.atoms.text_contrast_medium, a.italic],
          ]}
          numberOfLines={2}>
          {name ?? <Trans>No name</Trans>}
        </Text>
        {phoneNumber && currentAccount && (
          <Button
            label={_(msg`Invite ${name} to join Bluesky`)}
            color="secondary"
            size="small"
            onPress={async () => {
              try {
                await SMS.sendSMSAsync(
                  [phoneNumber],
                  _(
                    msg`I joined Bluesky as ${currentAccount.handle} - come find me! https://bsky.app/download`,
                  ),
                )
              } catch (err) {
                Toast.show(_(msg`Failed to launch SMS app`), {type: 'error'})
                logger.error('Could not launch SMS', {safeMessage: err})
              }
            }}>
            <ButtonIcon icon={EnvelopeIcon} />
            <ButtonText>
              <Trans>Invite</Trans>
            </ButtonText>
          </Button>
        )}
      </ProfileCard.Header>
    </View>
  )
}

function Header({
  titleText,
  subtitleText,
  children,
  hasContentAbove,
}: {
  titleText: React.ReactNode
  subtitleText?: React.ReactNode
  children?: React.ReactNode
  hasContentAbove?: boolean
}) {
  const gutter = useGutters([0, 'wide'])
  const t = useTheme()

  return (
    <View
      style={[
        gutter,
        a.pb_md,
        a.gap_sm,
        hasContentAbove
          ? [a.pt_4xl, a.border_t, t.atoms.border_contrast_low]
          : a.pt_md,
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <Text style={[a.text_3xl, a.font_bold]}>{titleText}</Text>
        {children}
      </View>
      {subtitleText && (
        <Text style={[a.text_md, t.atoms.text_contrast_medium, a.leading_snug]}>
          {subtitleText}
        </Text>
      )}
    </View>
  )
}
