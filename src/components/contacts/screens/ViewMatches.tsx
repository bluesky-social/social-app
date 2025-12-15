import {useCallback, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as SMS from 'expo-sms'
import {type ModerationOpts} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  updateProfileShadow,
  useProfileShadow,
} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  optimisticRemoveMatch,
  useMatchesPassthroughQuery,
} from '#/state/queries/find-contacts'
import {useAgent, useSession} from '#/state/session'
import {List, type ListMethods} from '#/view/com/util/List'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {OnboardingPosition} from '#/screens/Onboarding/Layout'
import {bulkWriteFollows} from '#/screens/Onboarding/util'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {SearchInput} from '#/components/forms/SearchInput'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {MagnifyingGlassX_Stroke2_Corner0_Rounded_Large as SearchFailedIcon} from '#/components/icons/MagnifyingGlass'
import {PersonX_Stroke2_Corner0_Rounded_Large as PersonXIcon} from '#/components/icons/Person'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {InviteInfo} from '../components/InviteInfo'
import {type Action, type Contact, type Match, type State} from '../state'

type Item =
  | {
      type: 'matches header'
      count: number
    }
  | {
      type: 'match'
      match: Match
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
      query: string
    }
  | {
      type: 'totally empty state'
    }

export function ViewMatches({
  state,
  dispatch,
  context,
  onNext,
}: {
  state: Extract<State, {step: '4: view matches'}>
  dispatch: React.ActionDispatch<[Action]>
  context: 'Onboarding' | 'Standalone'
  onNext: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const gutter = useGutters([0, 'wide'])
  const moderationOpts = useModerationOpts()
  const queryClient = useQueryClient()
  const agent = useAgent()
  const insets = useSafeAreaInsets()
  const listRef = useRef<ListMethods>(null)

  const [search, setSearch] = useState('')
  const {
    state: searchFocused,
    onIn: onFocus,
    onOut: onBlur,
  } = useInteractionState()

  // HACK: Although we already have the match data, we need to pass it through
  // a query to get it into the shadow state
  const allMatches = useMatchesPassthroughQuery(state.matches)
  const matches = allMatches.filter(
    match => !state.dismissedMatches.includes(match.profile.did),
  )

  const followableDids = matches.map(match => match.profile.did)
  const [didFollowAll, setDidFollowAll] = useState(followableDids.length === 0)

  const cumulativeFollowCount = useRef(0)
  const onFollow = useCallback(() => {
    logger.metric('contacts:matches:follow', {entryPoint: context})
    cumulativeFollowCount.current += 1
  }, [context])

  const {mutate: followAll, isPending: isFollowingAll} = useMutation({
    mutationFn: async () => {
      for (const did of followableDids) {
        updateProfileShadow(queryClient, did, {
          followingUri: 'pending',
        })
      }

      const uris = await wait(500, bulkWriteFollows(agent, followableDids))

      for (const did of followableDids) {
        const uri = uris.get(did)
        updateProfileShadow(queryClient, did, {
          followingUri: uri,
        })
      }
      return followableDids
    },
    onMutate: () =>
      logger.metric('contacts:matches:followAll', {
        followCount: followableDids.length,
        entryPoint: context,
      }),
    onSuccess: () => {
      setDidFollowAll(true)
      Toast.show(_(msg`All friends followed!`), {type: 'success'})
      cumulativeFollowCount.current += followableDids.length
    },
    onError: _err => {
      Toast.show(_(msg`Failed to follow all your friends, please try again`), {
        type: 'error',
      })
      for (const did of followableDids) {
        updateProfileShadow(queryClient, did, {
          followingUri: undefined,
        })
      }
    },
  })

  const items = useMemo(() => {
    const all: Item[] = []

    if (searchFocused || search.length > 0) {
      for (const match of matches) {
        if (
          search.length === 0 ||
          (match.profile.displayName ?? '')
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()) ||
          match.profile.handle
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())
        ) {
          all.push({type: 'match', match})
        }
      }

      for (const contact of state.contacts) {
        if (
          search.length === 0 ||
          [contact.firstName, contact.lastName]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())
        ) {
          all.push({type: 'contact', contact})
        }
      }

      if (all.length === 0) {
        all.push({type: 'search empty state', query: search})
      }
    } else {
      if (matches.length > 0) {
        all.push({type: 'matches header', count: matches.length})
        for (const match of matches) {
          all.push({type: 'match', match})
        }

        if (state.contacts.length > 0) {
          all.push({type: 'contacts header'})
        }
      } else if (state.contacts.length > 0) {
        all.push({type: 'no matches header'})
      }

      for (const contact of state.contacts) {
        all.push({type: 'contact', contact})
      }

      if (all.length === 0) {
        all.push({type: 'totally empty state'})
      }
    }

    return all
  }, [matches, state.contacts, search, searchFocused])

  const {mutate: dismissMatch} = useMutation({
    mutationFn: async (did: string) => {
      await agent.app.bsky.contact.dismissMatch({subject: did})
    },
    onMutate: did => {
      logger.metric('contacts:matches:dismiss', {entryPoint: context})
      dispatch({type: 'DISMISS_MATCH', payload: {did}})
    },
    onSuccess: (_res, did) => {
      // for the other screen
      optimisticRemoveMatch(queryClient, did)
    },
    onError: (err, did) => {
      dispatch({type: 'DISMISS_MATCH_FAILED', payload: {did}})
      if (isNetworkError(err)) {
        Toast.show(
          _(
            msg`Failed to hide suggestion, please check your internet connection`,
          ),
          {type: 'error'},
        )
      } else {
        logger.error('Dismissing match failed', {safeMessage: err})
        Toast.show(
          _(msg`An error occurred while hiding suggestion. ${cleanError(err)}`),
          {type: 'error'},
        )
      }
    },
  })

  const renderItem = ({item}: {item: Item}) => {
    switch (item.type) {
      case 'match':
        return (
          <MatchItem
            profile={item.match.profile}
            contact={item.match.contact}
            moderationOpts={moderationOpts}
            onRemoveSuggestion={dismissMatch}
            onFollow={onFollow}
          />
        )
      case 'contact':
        return <ContactItem contact={item.contact} context={context} />
      case 'matches header':
        return (
          <Header
            titleText={
              <Plural
                value={item.count}
                one="# friend found!"
                other="# friends found!"
              />
            }>
            {item.count > 1 && (
              <Button
                label={_(msg`Follow all`)}
                size="small"
                color="primary_subtle"
                onPress={() => followAll()}
                disabled={isFollowingAll || didFollowAll}>
                <ButtonIcon
                  icon={
                    isFollowingAll
                      ? Loader
                      : !didFollowAll
                        ? PlusIcon
                        : CheckIcon
                  }
                />
                <ButtonText>
                  <Trans>Follow all</Trans>
                </ButtonText>
              </Button>
            )}
          </Header>
        )
      case 'contacts header':
        return (
          <Header
            titleText={
              <Trans>
                Invite friends{' '}
                <InviteInfo iconStyle={t.atoms.text} iconOffset={1} />
              </Trans>
            }
            hasContentAbove
          />
        )
      case 'no matches header':
        return (
          <Header
            titleText={_(msg`You got here first`)}
            largeTitle
            subtitleText={
              <Trans>
                Bluesky is more fun with friends. Do you want to invite some of
                yours?{' '}
                <InviteInfo
                  iconStyle={t.atoms.text_contrast_medium}
                  iconOffset={2}
                />
              </Trans>
            }
          />
        )
      case 'search empty state':
        return <SearchEmptyState query={item.query} />
      case 'totally empty state':
        return <TotallyEmptyState />
    }
  }

  const isSearchEmpty = items?.[0]?.type === 'search empty state'
  const isTotallyEmpty = items?.[0]?.type === 'totally empty state'

  const isEmpty = isSearchEmpty || isTotallyEmpty

  return (
    <View style={[a.h_full]}>
      {context === 'Standalone' && (
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.BackButton />
          <Layout.Header.Content />
          <Layout.Header.Slot />
        </Layout.Header.Outer>
      )}
      {!isTotallyEmpty && (
        <View
          style={[
            gutter,
            a.mb_md,
            context === 'Onboarding' && [a.mt_sm, a.gap_sm],
          ]}>
          {context === 'Onboarding' && <OnboardingPosition />}
          <SearchInput
            placeholder={_(msg`Search contacts`)}
            value={search}
            onFocus={() => {
              onFocus()
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onBlur={() => {
              onBlur()
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onChangeText={text => {
              setSearch(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onClearText={() => setSearch('')}
          />
        </View>
      )}
      <List
        ref={listRef}
        data={items}
        renderItem={renderItem}
        ListFooterComponent={!isEmpty ? <ListFooter height={20} /> : null}
        keyExtractor={keyExtractor}
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      />
      <View
        style={[
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.border_t,
          a.align_center,
          a.align_stretch,
          gutter,
          a.pt_md,
          {paddingBottom: insets.bottom + tokens.space.md},
        ]}>
        <Button
          label={context === 'Onboarding' ? _(msg`Next`) : _(msg`Done`)}
          onPress={() => {
            if (context === 'Onboarding') {
              logger.metric('onboarding:contacts:nextPressed', {
                matchCount: allMatches.length,
                followCount: cumulativeFollowCount.current,
                dismissedMatchCount: state.dismissedMatches.length,
              })
            }
            onNext()
          }}
          size="large"
          color="primary">
          <ButtonText>
            {context === 'Onboarding' ? (
              <Trans>Next</Trans>
            ) : (
              <Trans>Done</Trans>
            )}
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

function keyExtractor(item: Item) {
  switch (item.type) {
    case 'contact':
      return item.contact.id
    case 'match':
      return item.match.profile.did
    default:
      return item.type
  }
}

function MatchItem({
  profile,
  contact,
  moderationOpts,
  onRemoveSuggestion,
  onFollow,
}: {
  profile: bsky.profile.AnyProfileView
  contact?: Contact
  moderationOpts?: ModerationOpts
  onRemoveSuggestion: (did: string) => void
  onFollow: () => void
}) {
  const gutter = useGutters([0, 'wide'])
  const t = useTheme()
  const {_} = useLingui()
  const shadow = useProfileShadow(profile)

  const contactName = useMemo(() => {
    if (!contact) return null

    const name = contact.name ?? contact.firstName ?? contact.lastName
    if (name) return _(msg`Your contact ${name}`)
    const phone =
      contact.phoneNumbers?.find(p => p.isPrimary) ?? contact.phoneNumbers?.[0]
    if (phone?.number) return phone.number
    return null
  }, [contact, _])

  if (!moderationOpts) return null

  return (
    <View style={[gutter, a.py_md, a.border_t, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.Avatar
          profile={profile}
          moderationOpts={moderationOpts}
          size={48}
        />
        <View style={[a.flex_1]}>
          <ProfileCard.Name
            profile={profile}
            moderationOpts={moderationOpts}
            textStyle={[a.leading_tight]}
          />
          <ProfileCard.Handle
            profile={profile}
            textStyle={[contactName && a.text_xs]}
          />
          {contactName && (
            <Text
              emoji
              style={[a.leading_snug, t.atoms.text_contrast_medium, a.text_xs]}
              numberOfLines={1}>
              {contactName}
            </Text>
          )}
        </View>
        <ProfileCard.FollowButton
          profile={profile}
          moderationOpts={moderationOpts}
          logContext="FindContacts"
          onFollow={onFollow}
        />
        {!shadow.viewer?.following && (
          <Button
            color="secondary"
            variant="ghost"
            label={_(msg`Remove suggestion`)}
            onPress={() => onRemoveSuggestion(profile.did)}
            hoverStyle={[a.bg_transparent, {opacity: 0.5}]}
            hitSlop={8}>
            <ButtonIcon icon={XIcon} />
          </Button>
        )}
      </ProfileCard.Header>
    </View>
  )
}

function ContactItem({
  contact,
  context,
}: {
  contact: Contact
  context: 'Onboarding' | 'Standalone'
}) {
  const gutter = useGutters([0, 'wide'])
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()

  const name = contact.name ?? contact.firstName ?? contact.lastName
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
              logger.metric('contacts:matches:invite', {
                entryPoint: context,
              })
              try {
                await SMS.sendSMSAsync(
                  [phoneNumber],
                  _(
                    msg`I'm on Bluesky as ${currentAccount.handle} - come find me! https://bsky.app/download`,
                  ),
                )
              } catch (err) {
                Toast.show(_(msg`Failed to launch SMS app`), {type: 'error'})
                logger.error('Could not launch SMS', {safeMessage: err})
              }
            }}>
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
  largeTitle,
  subtitleText,
  children,
  hasContentAbove,
}: {
  titleText: React.ReactNode
  largeTitle?: boolean
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
        <Text style={[largeTitle ? a.text_3xl : a.text_xl, a.font_bold]}>
          {titleText}
        </Text>
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

function SearchEmptyState({query}: {query: string}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.flex_col,
        a.align_center,
        a.justify_center,
        a.gap_lg,
        a.pt_5xl,
        a.px_5xl,
      ]}>
      <SearchFailedIcon width={64} style={[t.atoms.text_contrast_low]} />
      <Text
        style={[
          a.text_md,
          a.leading_snug,
          t.atoms.text_contrast_medium,
          a.text_center,
        ]}>
        <Trans>No contacts with the name “{query}” found</Trans>
      </Text>
    </View>
  )
}

function TotallyEmptyState() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.flex_col,
        a.align_center,
        a.justify_center,
        a.gap_lg,
        {paddingTop: 140},
        a.px_5xl,
      ]}>
      <PersonXIcon width={64} style={[t.atoms.text_contrast_low]} />
      <Text style={[a.text_xl, a.font_bold, a.leading_snug, a.text_center]}>
        <Trans>No contacts found</Trans>
      </Text>
    </View>
  )
}
