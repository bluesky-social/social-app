import {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Animated,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphFollow,
  moderateProfile,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {msg, Plural, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {forceLTR} from '#/lib/strings/bidi'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {type FeedNotification} from '#/state/queries/notifications/feed'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useAgent} from '#/state/session'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {Post} from '#/view/com/post/Post'
import {formatCount} from '#/view/com/util/numeric/format'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {PreviewableUserAvatar, UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, platform, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled} from '#/components/icons/Heart2'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {StarterPack} from '#/components/icons/StarterPack'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {InlineLinkText, Link} from '#/components/Link'
import * as MediaPreview from '#/components/MediaPreview'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Notification as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import * as bsky from '#/types/bsky'

const MAX_AUTHORS = 5

const EXPANDED_AUTHOR_EL_HEIGHT = 35

interface Author {
  profile: AppBskyActorDefs.ProfileView
  href: string
  moderation: ModerationDecision
}

let NotificationFeedItem = ({
  item,
  moderationOpts,
  highlightUnread,
  hideTopBorder,
}: {
  item: FeedNotification
  moderationOpts: ModerationOpts
  highlightUnread: boolean
  hideTopBorder?: boolean
}): React.ReactNode => {
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const t = useTheme()
  const {_, i18n} = useLingui()
  const [isAuthorsExpanded, setAuthorsExpanded] = useState<boolean>(false)
  const itemHref = useMemo(() => {
    if (item.type === 'post-like' || item.type === 'repost') {
      if (item.subjectUri) {
        const urip = new AtUri(item.subjectUri)
        return `/profile/${urip.host}/post/${urip.rkey}`
      }
    } else if (item.type === 'follow') {
      return makeProfileLink(item.notification.author)
    } else if (item.type === 'reply') {
      const urip = new AtUri(item.notification.uri)
      return `/profile/${urip.host}/post/${urip.rkey}`
    } else if (
      item.type === 'feedgen-like' ||
      item.type === 'starterpack-joined'
    ) {
      if (item.subjectUri) {
        const urip = new AtUri(item.subjectUri)
        return `/profile/${urip.host}/feed/${urip.rkey}`
      }
    }
    return ''
  }, [item])

  const onToggleAuthorsExpanded = (e?: GestureResponderEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setAuthorsExpanded(currentlyExpanded => !currentlyExpanded)
  }

  const onBeforePress = useCallback(() => {
    unstableCacheProfileView(queryClient, item.notification.author)
  }, [queryClient, item.notification.author])

  const authors: Author[] = useMemo(() => {
    return [
      {
        profile: item.notification.author,
        href: makeProfileLink(item.notification.author),
        moderation: moderateProfile(item.notification.author, moderationOpts),
      },
      ...(item.additional?.map(({author}) => ({
        profile: author,
        href: makeProfileLink(author),
        moderation: moderateProfile(author, moderationOpts),
      })) || []),
    ]
  }, [item, moderationOpts])

  const niceTimestamp = niceDate(i18n, item.notification.indexedAt)
  const firstAuthor = authors[0]
  const firstAuthorVerification = useSimpleVerificationState({
    profile: firstAuthor.profile,
  })
  const firstAuthorName = sanitizeDisplayName(
    firstAuthor.profile.displayName || firstAuthor.profile.handle,
  )

  if (item.subjectUri && !item.subject && item.type !== 'feedgen-like') {
    // don't render anything if the target post was deleted or unfindable
    return <View />
  }

  if (
    item.type === 'reply' ||
    item.type === 'mention' ||
    item.type === 'quote'
  ) {
    if (!item.subject) {
      return null
    }
    const isHighlighted = highlightUnread && !item.notification.isRead
    return (
      <Post
        post={item.subject}
        style={
          isHighlighted && {
            backgroundColor: pal.colors.unreadNotifBg,
            borderColor: pal.colors.unreadNotifBorder,
          }
        }
        hideTopBorder={hideTopBorder}
      />
    )
  }

  const firstAuthorLink = (
    <InlineLinkText
      key={firstAuthor.href}
      style={[t.atoms.text, a.font_bold, a.text_md, a.leading_tight]}
      to={firstAuthor.href}
      disableMismatchWarning
      emoji
      label={_(msg`Go to ${firstAuthorName}'s profile`)}>
      {forceLTR(firstAuthorName)}
      {firstAuthorVerification.showBadge && (
        <View
          style={[
            a.relative,
            {
              paddingTop: platform({android: 2}),
              marginBottom: platform({ios: -7}),
              top: platform({web: 1}),
              paddingLeft: 3,
              paddingRight: 2,
            },
          ]}>
          <VerificationCheck
            width={14}
            verifier={firstAuthorVerification.role === 'verifier'}
          />
        </View>
      )}
    </InlineLinkText>
  )
  const additionalAuthorsCount = authors.length - 1
  const hasMultipleAuthors = additionalAuthorsCount > 0
  const formattedAuthorsCount = hasMultipleAuthors
    ? formatCount(i18n, additionalAuthorsCount)
    : ''

  let a11yLabel = ''
  let notificationContent: ReactElement
  let icon = (
    <HeartIconFilled
      size="xl"
      style={[
        s.likeColor,
        // {position: 'relative', top: -4}
      ]}
    />
  )

  if (item.type === 'post-like') {
    a11yLabel = hasMultipleAuthors
      ? _(
          msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
            one: `${formattedAuthorsCount} other`,
            other: `${formattedAuthorsCount} others`,
          })} liked your post`,
        )
      : _(msg`${firstAuthorName} liked your post`)
    notificationContent = hasMultipleAuthors ? (
      <Trans>
        {firstAuthorLink} and{' '}
        <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
          <Plural
            value={additionalAuthorsCount}
            one={`${formattedAuthorsCount} other`}
            other={`${formattedAuthorsCount} others`}
          />
        </Text>{' '}
        liked your post
      </Trans>
    ) : (
      <Trans>{firstAuthorLink} liked your post</Trans>
    )
  } else if (item.type === 'repost') {
    a11yLabel = hasMultipleAuthors
      ? _(
          msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
            one: `${formattedAuthorsCount} other`,
            other: `${formattedAuthorsCount} others`,
          })} reposted your post`,
        )
      : _(msg`${firstAuthorName} reposted your post`)
    notificationContent = hasMultipleAuthors ? (
      <Trans>
        {firstAuthorLink} and{' '}
        <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
          <Plural
            value={additionalAuthorsCount}
            one={`${formattedAuthorsCount} other`}
            other={`${formattedAuthorsCount} others`}
          />
        </Text>{' '}
        reposted your post
      </Trans>
    ) : (
      <Trans>{firstAuthorLink} reposted your post</Trans>
    )
    icon = <RepostIcon size="xl" style={{color: t.palette.positive_600}} />
  } else if (item.type === 'follow') {
    let isFollowBack = false

    if (
      item.notification.author.viewer?.following &&
      bsky.dangerousIsType<AppBskyGraphFollow.Record>(
        item.notification.record,
        AppBskyGraphFollow.isRecord,
      )
    ) {
      let followingTimestamp
      try {
        const rkey = new AtUri(item.notification.author.viewer.following).rkey
        followingTimestamp = TID.fromStr(rkey).timestamp()
      } catch (e) {
        // For some reason the following URI was invalid. Default to it not being a follow back.
        console.error('Invalid following URI')
      }
      if (followingTimestamp) {
        const followedTimestamp =
          new Date(item.notification.record.createdAt).getTime() * 1000
        isFollowBack = followedTimestamp > followingTimestamp
      }
    }

    if (isFollowBack && !hasMultipleAuthors) {
      /*
       * Follow-backs are ungrouped, grouped follow-backs not supported atm,
       * see `src/state/queries/notifications/util.ts`
       */
      a11yLabel = _(msg`${firstAuthorName} followed you back`)
      notificationContent = <Trans>{firstAuthorLink} followed you back</Trans>
    } else {
      a11yLabel = hasMultipleAuthors
        ? _(
            msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
              one: `${formattedAuthorsCount} other`,
              other: `${formattedAuthorsCount} others`,
            })} followed you`,
          )
        : _(msg`${firstAuthorName} followed you`)
      notificationContent = hasMultipleAuthors ? (
        <Trans>
          {firstAuthorLink} and{' '}
          <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
            <Plural
              value={additionalAuthorsCount}
              one={`${formattedAuthorsCount} other`}
              other={`${formattedAuthorsCount} others`}
            />
          </Text>{' '}
          followed you
        </Trans>
      ) : (
        <Trans>{firstAuthorLink} followed you</Trans>
      )
    }
    icon = <PersonPlusIcon size="xl" style={{color: t.palette.primary_500}} />
  } else if (item.type === 'feedgen-like') {
    a11yLabel = hasMultipleAuthors
      ? _(
          msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
            one: `${formattedAuthorsCount} other`,
            other: `${formattedAuthorsCount} others`,
          })} liked your custom feed`,
        )
      : _(msg`${firstAuthorName} liked your custom feed`)
    notificationContent = hasMultipleAuthors ? (
      <Trans>
        {firstAuthorLink} and{' '}
        <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
          <Plural
            value={additionalAuthorsCount}
            one={`${formattedAuthorsCount} other`}
            other={`${formattedAuthorsCount} others`}
          />
        </Text>{' '}
        liked your custom feed
      </Trans>
    ) : (
      <Trans>{firstAuthorLink} liked your custom feed</Trans>
    )
  } else if (item.type === 'starterpack-joined') {
    a11yLabel = hasMultipleAuthors
      ? _(
          msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
            one: `${formattedAuthorsCount} other`,
            other: `${formattedAuthorsCount} others`,
          })} signed up with your starter pack`,
        )
      : _(msg`${firstAuthorName} signed up with your starter pack`)
    notificationContent = hasMultipleAuthors ? (
      <Trans>
        {firstAuthorLink} and{' '}
        <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
          <Plural
            value={additionalAuthorsCount}
            one={`${formattedAuthorsCount} other`}
            other={`${formattedAuthorsCount} others`}
          />
        </Text>{' '}
        signed up with your starter pack
      </Trans>
    ) : (
      <Trans>{firstAuthorLink} signed up with your starter pack</Trans>
    )
    icon = (
      <View style={{height: 30, width: 30}}>
        <StarterPack width={30} gradient="sky" />
      </View>
    )
    // @ts-ignore TODO
  } else if (item.type === 'verified') {
    a11yLabel = hasMultipleAuthors
      ? _(
          msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
            one: `${formattedAuthorsCount} other`,
            other: `${formattedAuthorsCount} others`,
          })} verified you`,
        )
      : _(msg`${firstAuthorName} verified you`)
    notificationContent = hasMultipleAuthors ? (
      <Trans>
        {firstAuthorLink} and{' '}
        <Text style={[pal.text, s.bold]}>
          <Plural
            value={additionalAuthorsCount}
            one={`${formattedAuthorsCount} other`}
            other={`${formattedAuthorsCount} others`}
          />
        </Text>{' '}
        verified you
      </Trans>
    ) : (
      <Trans>{firstAuthorLink} verified you</Trans>
    )
    icon = <VerifiedCheck size="xl" />
    // @ts-ignore TODO
  } else if (item.type === 'unverified') {
    a11yLabel = hasMultipleAuthors
      ? _(
          msg`${firstAuthorName} and ${plural(additionalAuthorsCount, {
            one: `${formattedAuthorsCount} other`,
            other: `${formattedAuthorsCount} others`,
          })} removed their verifications from your account`,
        )
      : _(msg`${firstAuthorName} removed their verification from your account`)
    notificationContent = hasMultipleAuthors ? (
      <Trans>
        {firstAuthorLink} and{' '}
        <Text style={[pal.text, s.bold]}>
          <Plural
            value={additionalAuthorsCount}
            one={`${formattedAuthorsCount} other`}
            other={`${formattedAuthorsCount} others`}
          />
        </Text>{' '}
        removed their verifications from your account
      </Trans>
    ) : (
      <Trans>
        {firstAuthorLink} removed their verification from your account
      </Trans>
    )
    icon = <VerifiedCheck size="xl" fill={t.palette.contrast_500} />
  } else {
    return null
  }
  a11yLabel += ` · ${niceTimestamp}`

  return (
    <Link
      label={a11yLabel}
      testID={`feedItem-by-${item.notification.author.handle}`}
      style={[
        a.flex_row,
        a.align_start,
        {padding: 10},
        a.pr_lg,
        t.atoms.border_contrast_low,
        item.notification.isRead
          ? undefined
          : {
              backgroundColor: pal.colors.unreadNotifBg,
              borderColor: pal.colors.unreadNotifBorder,
            },
        !hideTopBorder && a.border_t,
        a.overflow_hidden,
      ]}
      to={itemHref}
      accessible={!isAuthorsExpanded}
      accessibilityActions={
        hasMultipleAuthors
          ? [
              {
                name: 'toggleAuthorsExpanded',
                label: isAuthorsExpanded
                  ? _(msg`Collapse list of users`)
                  : _(msg`Expand list of users`),
              },
            ]
          : [
              {
                name: 'viewProfile',
                label: _(
                  msg`View ${
                    authors[0].profile.displayName || authors[0].profile.handle
                  }'s profile`,
                ),
              },
            ]
      }
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'activate') {
          onBeforePress()
        }
        if (e.nativeEvent.actionName === 'toggleAuthorsExpanded') {
          onToggleAuthorsExpanded()
        }
      }}>
      {({hovered}) => (
        <>
          <SubtleWebHover hover={hovered} />
          <View style={[styles.layoutIcon, a.pr_sm]}>
            {/* TODO: Prevent conditional rendering and move toward composable
          notifications for clearer accessibility labeling */}
            {icon}
          </View>
          <View style={[a.flex_1]}>
            <ExpandListPressable
              hasMultipleAuthors={hasMultipleAuthors}
              onToggleAuthorsExpanded={onToggleAuthorsExpanded}>
              <CondensedAuthorsList
                visible={!isAuthorsExpanded}
                authors={authors}
                onToggleAuthorsExpanded={onToggleAuthorsExpanded}
                showDmButton={item.type === 'starterpack-joined'}
              />
              <ExpandedAuthorsList
                visible={isAuthorsExpanded}
                authors={authors}
              />
              <Text
                style={[
                  a.flex_row,
                  a.flex_wrap,
                  {paddingTop: 6},
                  a.self_start,
                  a.text_md,
                  a.leading_snug,
                ]}
                accessibilityHint=""
                accessibilityLabel={a11yLabel}>
                {notificationContent}
                <TimeElapsed timestamp={item.notification.indexedAt}>
                  {({timeElapsed}) => (
                    <>
                      {/* make sure there's whitespace around the middot -sfn */}
                      <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                        {' '}
                        &middot;{' '}
                      </Text>
                      <Text
                        style={[a.text_md, t.atoms.text_contrast_medium]}
                        title={niceTimestamp}>
                        {timeElapsed}
                      </Text>
                    </>
                  )}
                </TimeElapsed>
              </Text>
            </ExpandListPressable>
            {item.type === 'post-like' || item.type === 'repost' ? (
              <View style={[a.pt_2xs]}>
                <AdditionalPostText post={item.subject} />
              </View>
            ) : null}
            {item.type === 'feedgen-like' && item.subjectUri ? (
              <FeedSourceCard
                feedUri={item.subjectUri}
                style={[
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                  a.border,
                  styles.feedcard,
                ]}
                showLikes
              />
            ) : null}
            {item.type === 'starterpack-joined' ? (
              <View>
                <View
                  style={[
                    a.border,
                    a.p_sm,
                    a.rounded_sm,
                    a.mt_sm,
                    t.atoms.border_contrast_low,
                  ]}>
                  <StarterPackCard starterPack={item.subject} />
                </View>
              </View>
            ) : null}
          </View>
        </>
      )}
    </Link>
  )
}
NotificationFeedItem = memo(NotificationFeedItem)
export {NotificationFeedItem}

function ExpandListPressable({
  hasMultipleAuthors,
  children,
  onToggleAuthorsExpanded,
}: {
  hasMultipleAuthors: boolean
  children: React.ReactNode
  onToggleAuthorsExpanded: (e: GestureResponderEvent) => void
}) {
  if (hasMultipleAuthors) {
    return (
      <Pressable
        onPress={onToggleAuthorsExpanded}
        style={[styles.expandedAuthorsTrigger]}
        accessible={false}>
        {children}
      </Pressable>
    )
  } else {
    return <>{children}</>
  }
}

function SayHelloBtn({profile}: {profile: AppBskyActorDefs.ProfileView}) {
  const {_} = useLingui()
  const agent = useAgent()
  const navigation = useNavigation<NavigationProp>()
  const [isLoading, setIsLoading] = useState(false)

  if (
    profile.associated?.chat?.allowIncoming === 'none' ||
    (profile.associated?.chat?.allowIncoming === 'following' &&
      !profile.viewer?.followedBy)
  ) {
    return null
  }

  return (
    <Button
      label={_(msg`Say hello!`)}
      variant="ghost"
      color="primary"
      size="small"
      style={[a.self_center, {marginLeft: 'auto'}]}
      disabled={isLoading}
      onPress={async () => {
        try {
          setIsLoading(true)
          const res = await agent.api.chat.bsky.convo.getConvoForMembers(
            {
              members: [profile.did, agent.session!.did!],
            },
            {headers: DM_SERVICE_HEADERS},
          )
          navigation.navigate('MessagesConversation', {
            conversation: res.data.convo.id,
          })
        } catch (e) {
          logger.error('Failed to get conversation', {safeMessage: e})
        } finally {
          setIsLoading(false)
        }
      }}>
      <ButtonText>
        <Trans>Say hello!</Trans>
      </ButtonText>
    </Button>
  )
}

function CondensedAuthorsList({
  visible,
  authors,
  onToggleAuthorsExpanded,
  showDmButton = true,
}: {
  visible: boolean
  authors: Author[]
  onToggleAuthorsExpanded: (e: GestureResponderEvent) => void
  showDmButton?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()

  if (!visible) {
    return (
      <View style={[a.flex_row, a.align_center]}>
        <TouchableOpacity
          style={styles.expandedAuthorsCloseBtn}
          onPress={onToggleAuthorsExpanded}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Hide user list`)}
          accessibilityHint={_(
            msg`Collapses list of users for a given notification`,
          )}>
          <ChevronUpIcon
            size="md"
            style={[a.ml_xs, a.mr_md, t.atoms.text_contrast_high]}
          />
          <Text style={[a.text_md, t.atoms.text_contrast_high]}>
            <Trans context="action">Hide</Trans>
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
  if (authors.length === 1) {
    return (
      <View style={[a.flex_row, a.align_center]}>
        <PreviewableUserAvatar
          size={35}
          profile={authors[0].profile}
          moderation={authors[0].moderation.ui('avatar')}
          type={authors[0].profile.associated?.labeler ? 'labeler' : 'user'}
        />
        {showDmButton ? <SayHelloBtn profile={authors[0].profile} /> : null}
      </View>
    )
  }
  return (
    <TouchableOpacity
      accessibilityRole="none"
      onPress={onToggleAuthorsExpanded}>
      <View style={[a.flex_row, a.align_center]}>
        {authors.slice(0, MAX_AUTHORS).map(author => (
          <View key={author.href} style={s.mr5}>
            <PreviewableUserAvatar
              size={35}
              profile={author.profile}
              moderation={author.moderation.ui('avatar')}
              type={author.profile.associated?.labeler ? 'labeler' : 'user'}
            />
          </View>
        ))}
        {authors.length > MAX_AUTHORS ? (
          <Text
            style={[
              a.font_bold,
              {paddingLeft: 6},
              t.atoms.text_contrast_medium,
            ]}>
            +{authors.length - MAX_AUTHORS}
          </Text>
        ) : undefined}
        <ChevronDownIcon
          size="md"
          style={[a.mx_xs, t.atoms.text_contrast_medium]}
        />
      </View>
    </TouchableOpacity>
  )
}

function ExpandedAuthorsList({
  visible,
  authors,
}: {
  visible: boolean
  authors: Author[]
}) {
  const heightInterp = useAnimatedValue(visible ? 1 : 0)
  const targetHeight =
    authors.length * (EXPANDED_AUTHOR_EL_HEIGHT + 10) /*10=margin*/
  const heightStyle = {
    height: Animated.multiply(heightInterp, targetHeight),
  }
  useEffect(() => {
    Animated.timing(heightInterp, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [heightInterp, visible])

  return (
    <Animated.View style={[a.overflow_hidden, heightStyle]}>
      {visible &&
        authors.map(author => (
          <ExpandedAuthorCard key={author.profile.did} author={author} />
        ))}
    </Animated.View>
  )
}

function ExpandedAuthorCard({author}: {author: Author}) {
  const t = useTheme()
  const {_} = useLingui()
  const verification = useSimpleVerificationState({
    profile: author.profile,
  })
  return (
    <Link
      key={author.profile.did}
      label={author.profile.displayName || author.profile.handle}
      accessibilityHint={_(msg`Opens this profile`)}
      to={makeProfileLink({
        did: author.profile.did,
        handle: author.profile.handle,
      })}
      style={styles.expandedAuthor}>
      <View style={[a.mr_sm]}>
        <ProfileHoverCard did={author.profile.did}>
          <UserAvatar
            size={35}
            avatar={author.profile.avatar}
            moderation={author.moderation.ui('avatar')}
            type={author.profile.associated?.labeler ? 'labeler' : 'user'}
          />
        </ProfileHoverCard>
      </View>
      <View style={[a.flex_1]}>
        <View style={[a.flex_row, a.align_end]}>
          <Text
            numberOfLines={1}
            emoji
            style={[
              a.text_md,
              a.font_bold,
              a.leading_tight,
              {maxWidth: '70%'},
            ]}>
            {sanitizeDisplayName(
              author.profile.displayName || author.profile.handle,
            )}
          </Text>
          {verification.showBadge && (
            <View style={[a.pl_xs, a.self_center]}>
              <VerificationCheck
                width={14}
                verifier={verification.role === 'verifier'}
              />
            </View>
          )}
          <Text
            numberOfLines={1}
            style={[
              a.pl_xs,
              a.text_md,
              a.leading_tight,
              a.flex_shrink,
              t.atoms.text_contrast_medium,
            ]}>
            {sanitizeHandle(author.profile.handle, '@')}
          </Text>
        </View>
      </View>
    </Link>
  )
}

function AdditionalPostText({post}: {post?: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  if (
    post &&
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post?.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    const text = post.record.text

    return (
      <>
        {text?.length > 0 && (
          <Text
            emoji
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            {text}
          </Text>
        )}
        <MediaPreview.Embed
          embed={post.embed}
          style={styles.additionalPostImages}
        />
      </>
    )
  }
}

const styles = StyleSheet.create({
  layoutIcon: {
    width: 60,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  icon: {
    marginRight: 10,
    marginTop: 4,
  },
  additionalPostImages: {
    marginTop: 5,
    marginLeft: 2,
    opacity: 0.8,
  },
  feedcard: {
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 6,
  },
  addedContainer: {
    paddingTop: 4,
    paddingLeft: 36,
  },
  expandedAuthorsTrigger: {
    zIndex: 1,
  },
  expandedAuthorsCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  expandedAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    height: EXPANDED_AUTHOR_EL_HEIGHT,
  },
})
