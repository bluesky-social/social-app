import React, {useEffect, useMemo} from 'react'
import {View, StyleSheet} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, CommentBottomArrow} from 'lib/icons'
import {DotDotDotIcon} from 'lib/icons-w2'
import {Link} from '../../util/Link'
import {AtUri, RichText as RichTextObj} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {MiniblogModel} from 'state/models/feeds/waverly/miniblog'
import {useStores} from 'state/index'
import {RichText} from 'view/com/util/text/RichText'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {useEmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {EmbedBlock} from './EmbedBlock'
import {IsQuote, QuoteInfo} from '../util/Quote'
import {FabPickable} from '../web-reader/DraggableFab'

const LONG_POST_LENGTH = 200

function LikesAndCommentsFooter({
  likesCount,
  commentsCount,
}: {
  likesCount: number
  commentsCount: number
}) {
  const pal = usePalette('default')

  return (
    <View style={styles.likesAndCommentsContainer}>
      <View style={styles.likeIconAndText}>
        <HeartIcon strokeWidth={2} size={20} style={pal.text} />
        <Text type="sm" style={pal.text}>
          {likesCount} likes
        </Text>
      </View>
      <View style={styles.commentsIconAndText}>
        <CommentBottomArrow strokeWidth={2} size={20} style={pal.text} />
        <Text type="sm" style={pal.text}>
          {commentsCount} comments
        </Text>
      </View>
      <View style={styles.hamburgerButtonStyle}>
        <DotDotDotIcon size={20} style={pal.text} />
      </View>
    </View>
  )
}

interface Props {
  groupPost: PostsFeedItemModel
}

export const CardBody = observer(function CardBody({groupPost}: Props) {
  const pal = usePalette('default')
  const store = useStores()

  const userPost = useMemo(
    () => groupPost.reply?.root as PostView | undefined,
    [groupPost.reply?.root],
  )

  const miniblog = useMemo(
    () => groupPost && MiniblogModel.fromFeedItem(store, groupPost),
    [groupPost, store],
  )
  useEffect(() => {
    if (miniblog && !miniblog.hasLoaded && !miniblog.isLoading) {
      miniblog.load().catch(err => {
        store.log.error('Failed to fetch miniblog', err)
      })
    }
  }, [miniblog, store])

  const links = useMemo(() => {
    const handle = groupPost.post.author.handle
    const rkey = new AtUri(groupPost.post.uri).rkey
    return {
      post: `/profile/${handle}/w/${rkey}`,
      reader: `/profile/${handle}/reader/${rkey}`,
    }
  }, [groupPost.post])

  const bodyText = miniblog?.richText?.text ?? ''

  // Make a list of all paragraphs in the post that are a quote.
  let quoteList: QuoteInfo[] = []
  if (miniblog?.richText)
    miniblog.richText.text.split('\n').forEach(a => {
      const qi = IsQuote(a)
      if (qi.bIsQuote) quoteList.push(qi)
    })

  // TODO: for now, we're only comparing against the first quote block.
  const firstQuote = quoteList.length > 0 ? quoteList[0] : undefined

  // Strip away quote blocks, leaving only non-quote paragraphs.
  const paragraphs = miniblog?.richText
    ? new RichTextObj({
        text: miniblog.richText.text
          .split('\n')
          .filter(
            text =>
              text.length > 0 && (!firstQuote || text !== firstQuote.orig),
          )
          .join('\n\n'),
        facets: miniblog.richText!.facets,
      })
    : undefined

  const embedInfo = useEmbedInfo(
    userPost?.embed,
    links.reader,
    firstQuote?.asQuote,
  )

  // Put image outside if this this is a short post
  const embedLoc =
    embedInfo.type === 'link'
      ? 'inside-below'
      : embedInfo.type === 'youtube' || bodyText.length < LONG_POST_LENGTH
      ? 'outside'
      : 'inside-above'
  const likesCount = 12
  const commentsCount = 4

  // TODO: Add logic for variably determining if '... Read more' is required.

  // A post with at least some amount of text.
  return (
    <View style={styles.rootContainer}>
      {embedLoc === 'outside' && (
        <EmbedBlock
          embedInfo={embedInfo}
          imageStyle={styles.topImage}
          fullAxis="largest"
          postUri={links.post}
        />
      )}
      <View style={[styles.dropShadow, pal.view]}>
        <View style={[styles.bottomContainer]}>
          {embedLoc === 'inside-above' && (
            <EmbedBlock
              embedInfo={embedInfo}
              portraitExtraStyle={styles.portraitImage}
              fullAxis="width"
              postUri={links.post}
            />
          )}
          <View style={styles.containerMargins}>
            {bodyText && (
              <Link style={styles.bodyText} href={links.post} noFeedback>
                <FabPickable
                  pickID={'postBody'}
                  data={miniblog?.richText?.text}
                  type={'postText'}
                  zOrder={10}>
                  <RichText
                    key={`post-card-body`}
                    type="post-text"
                    style={[pal.text]}
                    lineHeight={1.6}
                    richText={paragraphs}
                    numberOfLines={30}
                  />
                </FabPickable>
              </Link>
            )}
            {embedLoc === 'inside-below' && (
              <FabPickable
                pickID={'postLink'}
                data={embedInfo}
                type={'embedInfo'}
                zOrder={10}>
                <EmbedBlock
                  embedInfo={embedInfo}
                  imageStyle={styles.linkImage}
                  containerStyle={[styles.linkContainer, pal.border]}
                  fullAxis="width"
                />
              </FabPickable>
            )}
            <LikesAndCommentsFooter
              likesCount={likesCount}
              commentsCount={commentsCount}
            />
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  rootContainer: {
    gap: 10,
    flex: 1,
    flexGrow: 1,
    alignItems: 'stretch',
  },
  topImage: {
    backgroundColor: '#1F1F1F26',
    borderRadius: 6,
    minHeight: 260,
    flex: 1,
  },
  portraitImage: {
    flexShrink: 0.5,
  },
  linkContainer: {
    borderRadius: 5,
    borderWidth: 0.5,
  },
  linkImage: {
    maxHeight: 300,
  },
  // shadow separate from bottomContainer otherwise overflow: 'hidden' breaks it
  dropShadow: {
    flexShrink: 1,
    borderRadius: 10,
    alignItems: 'stretch',
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bottomContainer: {
    flexShrink: 1,
    borderRadius: 10,
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  containerMargins: {
    flexShrink: 1,
    padding: 16,
    gap: 16,
    alignItems: 'stretch',
  },
  bodyText: {
    flexShrink: 1,
    flexBasis: 500,
    gap: 15,
    overflow: 'hidden',
  },
  likeIconAndText: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  commentsIconAndText: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  likesAndCommentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamburgerButtonStyle: {
    marginLeft: 'auto',
  },
})
