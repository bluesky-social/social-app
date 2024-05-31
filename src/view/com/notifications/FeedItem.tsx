import React, {memo, useEffect, useMemo, useState} from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  moderateProfile,
  ModerationDecision,
  ModerationOpts,
} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {FeedNotification} from '#/state/queries/notifications/feed'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {niceDate} from 'lib/strings/time'
import {colors, s} from 'lib/styles'
import {isWeb} from 'platform/detection'
import {precacheProfile} from 'state/queries/profile'
import {atoms as a, useTheme} from '#/alf'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled} from '#/components/icons/Heart2'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Link as NewLink} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {FeedSourceCard} from '../feeds/FeedSourceCard'
import {Post} from '../post/Post'
import {ImageHorzList} from '../util/images/ImageHorzList'
import {Link, TextLink} from '../util/Link'
import {formatCount} from '../util/numeric/format'
import {Text} from '../util/text/Text'
import {TimeElapsed} from '../util/TimeElapsed'
import {PreviewableUserAvatar, UserAvatar} from '../util/UserAvatar'

import hairlineWidth = StyleSheet.hairlineWidth

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
  const {_} = useLingui()
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
    } else if (item.type === 'feedgen-like') {
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
        />
      </Link>
    )
  }

  let action = ''
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
    action = _(msg`liked your post`)
  } else if (item.type === 'repost') {
    action = _(msg`reposted your post`)
    icon = <RepostIcon size="xl" style={{color: t.palette.positive_600}} />
  } else if (item.type === 'follow') {
    action = _(msg`followed you`)
    icon = <PersonPlusIcon size="xl" style={{color: t.palette.primary_500}} />
  } else if (item.type === 'feedgen-like') {
    action = _(msg`liked your custom feed`)
  } else {
    return null
  }

  let formattedCount = authors.length > 1 ? formatCount(authors.length - 1) : ''
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
        {borderTopWidth: hideTopBorder ? 0 : hairlineWidth},
      ]}
      href={itemHref}
      noFeedback
      accessible={!isAuthorsExpanded}
      accessibilityActions={
        authors.length > 1
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
      onBeforePress={onBeforePress}>
      <View style={[styles.layoutIcon, a.pr_sm]}>
        {/* TODO: Prevent conditional rendering and move toward composable
        notifications for clearer accessibility labeling */}
        {icon}
      </View>
      <View style={styles.layoutContent}>
        <ExpandListPressable
          hasMultipleAuthors={authors.length > 1}
          onToggleAuthorsExpanded={onToggleAuthorsExpanded}>
          <CondensedAuthorsList
            visible={!isAuthorsExpanded}
            authors={authors}
            onToggleAuthorsExpanded={onToggleAuthorsExpanded}
          />
          <ExpandedAuthorsList visible={isAuthorsExpanded} authors={authors} />
          <Text style={styles.meta}>
            <TextLink
              key={authors[0].href}
              style={[pal.text, s.bold]}
              href={authors[0].href}
              text={sanitizeDisplayName(
                authors[0].profile.displayName || authors[0].profile.handle,
              )}
              disableMismatchWarning
            />
            {authors.length > 1 ? (
              <>
                <Text style={[pal.text, s.mr5, s.ml5]}>
                  {' '}
                  <Trans>and</Trans>{' '}
                </Text>
                <Text style={[pal.text, s.bold]}>
                  {plural(authors.length - 1, {
                    one: `${formattedCount} other`,
                    other: `${formattedCount} others`,
                  })}
                </Text>
              </>
            ) : undefined}
            <Text style={[pal.text]}> {action}</Text>
            <TimeElapsed timestamp={item.notification.indexedAt}>
              {({timeElapsed}) => (
                <Text
                  style={[pal.textLight, styles.pointer]}
                  title={niceDate(item.notification.indexedAt)}>
                  {' ' + timeElapsed}
                </Text>
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
            style={[pal.view, pal.border, styles.feedcard]}
            showLikes
          />
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

function CondensedAuthorsList({
  visible,
  authors,
  onToggleAuthorsExpanded,
}: {
  visible: boolean
  authors: Author[]
  onToggleAuthorsExpanded: () => void
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
      <View style={styles.avis}>
        <PreviewableUserAvatar
          size={35}
          profile={authors[0].profile}
          moderation={authors[0].moderation.ui('avatar')}
          type={authors[0].profile.associated?.labeler ? 'labeler' : 'user'}
          accessible={false}
        />
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
              accessible={false}
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
    <Animated.View style={[heightStyle, styles.overflowHidden]}>
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
                {sanitizeDisplayName(
                  author.profile.displayName || author.profile.handle,
                )}
                &nbsp;
                <Text style={[pal.textLight]} lineHeight={1.2}>
                  {sanitizeHandle(author.profile.handle)}
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
    const images = AppBskyEmbedImages.isView(post.embed)
      ? post.embed.images
      : AppBskyEmbedRecordWithMedia.isView(post.embed) &&
        AppBskyEmbedImages.isView(post.embed.media)
      ? post.embed.media.images
      : undefined
    return (
      <>
        {text?.length > 0 && <Text style={pal.textLight}>{text}</Text>}
        {images && images.length > 0 && (
          <ImageHorzList images={images} style={styles.additionalPostImages} />
        )}
      </>
    )
  }
}

const styles = StyleSheet.create({
  overflowHidden: {
    overflow: 'hidden',
  },
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
    width: 70,
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
    fontWeight: 'bold',
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
    borderWidth: 1,
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
