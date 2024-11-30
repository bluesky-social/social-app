import React, {
  memo,
  type ReactElement,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphFollow,
  moderateProfile,
  ModerationDecision,
  ModerationOpts,
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
import {NavigationProp} from '#/lib/routes/types'
import {forceLTR} from '#/lib/strings/bidi'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {colors, s} from '#/lib/styles'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {FeedNotification} from '#/state/queries/notifications/feed'
import {precacheProfile} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled} from '#/components/icons/Heart2'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {StarterPack} from '#/components/icons/StarterPack'
import {Link as NewLink} from '#/components/Link'
import * as MediaPreview from '#/components/MediaPreview'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Notification as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import {FeedSourceCard} from '../feeds/FeedSourceCard'
import {Post} from '../post/Post'
import {Link, TextLink} from '../util/Link'
import {formatCount} from '../util/numeric/format'
import {Text} from '../util/text/Text'
import {TimeElapsed} from '../util/TimeElapsed'
import {PreviewableUserAvatar, UserAvatar} from '../util/UserAvatar'

const MAX_AUTHORS = 5

const EXPANDED_AUTHOR_EL_HEIGHT = 35

interface Author {
  profile: AppBskyActorDefs.ProfileViewBasic
  href: string
  moderation: ModerationDecision
}

let FeedItem = ({
  item,
  moderationOpts,
  hideTopBorder,
}: {
  item: FeedNotification
  moderationOpts: ModerationOpts
  hideTopBorder?: boolean
}): React.ReactNode => {
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const {_, i18n} = useLingui()
  const t = useTheme()
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

  const onToggleAuthorsExpanded = () => {
    setAuthorsExpanded(currentlyExpanded => !currentlyExpanded)
  }

  const onBeforePress = React.useCallback(() => {
    precacheProfile(queryClient, item.notification.author)
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

  const [hover, setHover] = React.useState(false)

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
    return (
      <Link
        testID={`feedItem-by-${item.notification.author.handle}`}
        href={itemHref}
        noFeedback
        accessible={false}>
        <Post
          post={item.subject}
          style={
            item.notification.isRead
              ? undefined
              : {
                  backgroundColor: pal.colors.unreadNotifBg,
                  borderColor: pal.colors.unreadNotifBorder,
                }
          }
          hideTopBorder={hideTopBorder}
        />
      </Link>
    )
  }

  const niceTimestamp = niceDate(i18n, item.notification.indexedAt)
  const firstAuthor = authors[0]
  const firstAuthorName = sanitizeDisplayName(
    firstAuthor.profile.displayName || firstAuthor.profile.handle,
  )
  const firstAuthorLink = (
    <TextLink
      key={firstAuthor.href}
      style={[pal.text, s.bold]}
      href={firstAuthor.href}
      text={
        <Text emoji style={[pal.text, s.bold]}>
          {forceLTR(firstAuthorName)}
        </Text>
      }
      disableMismatchWarning
    />
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
        <Text style={[pal.text, s.bold]}>
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
        <Text style={[pal.text, s.bold]}>
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
      AppBskyGraphFollow.isRecord(item.notification.record)
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
          <Text style={[pal.text, s.bold]}>
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
        <Text style={[pal.text, s.bold]}>
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
        <Text style={[pal.text, s.bold]}>
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
  } else {
    return null
  }
  a11yLabel += ` · ${niceTimestamp}`

  return (
    <Link
      testID={`feedItem-by-${item.notification.author.handle}`}
      style={[
        styles.outer,
        pal.border,
        item.notification.isRead
          ? undefined
          : {
              backgroundColor: pal.colors.unreadNotifBg,
              borderColor: pal.colors.unreadNotifBorder,
            },
        {borderTopWidth: hideTopBorder ? 0 : StyleSheet.hairlineWidth},
        a.overflow_hidden,
      ]}
      href={itemHref}
      noFeedback
      accessibilityHint=""
      accessibilityLabel={a11yLabel}
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
      }}
      onPointerEnter={() => {
        setHover(true)
      }}
      onPointerLeave={() => {
        setHover(false)
      }}>
      <SubtleWebHover hover={hover} />
      <View style={[styles.layoutIcon, a.pr_sm]}>
        {/* TODO: Prevent conditional rendering and move toward composable
        notifications for clearer accessibility labeling */}
        {icon}
      </View>
      <View style={styles.layoutContent}>
        <ExpandListPressable
          hasMultipleAuthors={hasMultipleAuthors}
          onToggleAuthorsExpanded={onToggleAuthorsExpanded}>
          <CondensedAuthorsList
            visible={!isAuthorsExpanded}
            authors={authors}
            onToggleAuthorsExpanded={onToggleAuthorsExpanded}
            showDmButton={item.type === 'starterpack-joined'}
          />
          <ExpandedAuthorsList visible={isAuthorsExpanded} authors={authors} />
          <Text
            style={[styles.meta, a.self_start, pal.text]}
            accessibilityHint=""
            accessibilityLabel={a11yLabel}>
            {notificationContent}
            <TimeElapsed timestamp={item.notification.indexedAt}>
              {({timeElapsed}) => (
                <>
                  {/* make sure there's whitespace around the middot -sfn */}
                  <Text style={[pal.textLight]}> &middot; </Text>
                  <Text style={[pal.textLight]} title={niceTimestamp}>
                    {timeElapsed}
                  </Text>
                </>
              )}
            </TimeElapsed>
          </Text>
        </ExpandListPressable>
        {item.type === 'post-like' || item.type === 'repost' ? (
          <AdditionalPostText post={item.subject} />
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
    </Link>
  )
}
FeedItem = memo(FeedItem)
export {FeedItem}

function ExpandListPressable({
  hasMultipleAuthors,
  children,
  onToggleAuthorsExpanded,
}: {
  hasMultipleAuthors: boolean
  children: React.ReactNode
  onToggleAuthorsExpanded: () => void
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

function SayHelloBtn({profile}: {profile: AppBskyActorDefs.ProfileViewBasic}) {
  const {_} = useLingui()
  const agent = useAgent()
  const navigation = useNavigation<NavigationProp>()
  const [isLoading, setIsLoading] = React.useState(false)

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
  onToggleAuthorsExpanded: () => void
  showDmButton?: boolean
}) {
  const pal = usePalette('default')
  const {_} = useLingui()

  if (!visible) {
    return (
      <View style={styles.avis}>
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
            style={[styles.expandedAuthorsCloseBtnIcon, pal.text]}
          />
          <Text type="sm-medium" style={pal.text}>
            <Trans context="action">Hide</Trans>
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
  if (authors.length === 1) {
    return (
      <View style={[styles.avis]}>
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
      <View style={styles.avis}>
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
          <Text style={[styles.aviExtraCount, pal.textLight]}>
            +{authors.length - MAX_AUTHORS}
          </Text>
        ) : undefined}
        <ChevronDownIcon
          size="md"
          style={[styles.expandedAuthorsCloseBtnIcon, pal.textLight]}
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
  const {_} = useLingui()
  const pal = usePalette('default')
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
          <NewLink
            key={author.profile.did}
            label={author.profile.displayName || author.profile.handle}
            accessibilityHint={_(msg`Opens this profile`)}
            to={makeProfileLink({
              did: author.profile.did,
              handle: author.profile.handle,
            })}
            style={styles.expandedAuthor}>
            <View style={styles.expandedAuthorAvi}>
              <ProfileHoverCard did={author.profile.did}>
                <UserAvatar
                  size={35}
                  avatar={author.profile.avatar}
                  moderation={author.moderation.ui('avatar')}
                  type={author.profile.associated?.labeler ? 'labeler' : 'user'}
                />
              </ProfileHoverCard>
            </View>
            <View style={s.flex1}>
              <Text
                type="lg-bold"
                numberOfLines={1}
                style={pal.text}
                lineHeight={1.2}>
                <Text emoji type="lg-bold" style={pal.text} lineHeight={1.2}>
                  {sanitizeDisplayName(
                    author.profile.displayName || author.profile.handle,
                  )}
                </Text>{' '}
                <Text style={[pal.textLight]} lineHeight={1.2}>
                  {sanitizeHandle(author.profile.handle, '@')}
                </Text>
              </Text>
            </View>
          </NewLink>
        ))}
    </Animated.View>
  )
}

function AdditionalPostText({post}: {post?: AppBskyFeedDefs.PostView}) {
  const pal = usePalette('default')
  if (post && AppBskyFeedPost.isRecord(post?.record)) {
    const text = post.record.text

    return (
      <>
        {text?.length > 0 && (
          <Text emoji style={pal.textLight}>
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
  pointer: isWeb
    ? {
        // @ts-ignore web only
        cursor: 'pointer',
      }
    : {},

  outer: {
    padding: 10,
    paddingRight: 15,
    flexDirection: 'row',
  },
  layoutIcon: {
    width: 60,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  icon: {
    marginRight: 10,
    marginTop: 4,
  },
  layoutContent: {
    flex: 1,
  },
  avis: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aviExtraCount: {
    fontWeight: '600',
    paddingLeft: 6,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 6,
    paddingBottom: 2,
  },
  postText: {
    paddingBottom: 5,
    color: colors.black,
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
  expandedAuthorsCloseBtnIcon: {
    marginLeft: 4,
    marginRight: 4,
  },
  expandedAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    height: EXPANDED_AUTHOR_EL_HEIGHT,
  },
  expandedAuthorAvi: {
    marginRight: 5,
  },
})
