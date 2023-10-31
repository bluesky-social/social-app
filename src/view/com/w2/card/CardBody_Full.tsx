import React, {useEffect, useMemo, useState} from 'react'
import {
  View,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native'
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
import {UserAvatar} from 'view/com/util/UserAvatar'
import {
  ProfileViewBasic,
  ProfileViewDetailed,
} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'
import LinearGradient from 'react-native-linear-gradient'
//import {runInAction} from 'mobx'

const LONG_POST_LENGTH = 200

/////////////////////////////////////////////////////////////////////////////

function toBasicProfile(p: ProfileViewDetailed): ProfileViewBasic {
  return {
    did: p.did,
    handle: p.handle,
    displayName: p.displayName ?? '<Unknown group>',
    avatar: p.avatar,
  }
}

/////////////////////////////////////////////////////////////////////////////

// const useDelayedRender = (delay: number) => {
//   const [delayed, setDelayed] = useState(true)
//   useEffect(() => {
//     const timeout = setTimeout(() => setDelayed(false), delay)
//     return () => clearTimeout(timeout)
//   }, [])
//   return fn => !delayed && fn()
// }

/////////////////////////////////////////////////////////////////////////////

function LikesAndCommentsFooter({
  likesCount,
  commentsCount,
  bInverted,
}: {
  likesCount: number
  commentsCount: number
  bInverted?: boolean
}) {
  const pal = usePalette('default')

  return (
    <View style={styles.likesAndCommentsContainer}>
      <View style={styles.likeIconAndText}>
        <HeartIcon
          strokeWidth={2}
          size={20}
          style={bInverted ? pal.textInverted : pal.text}
        />
        <Text type="sm" style={bInverted ? pal.textInverted : pal.text}>
          {likesCount} likes
        </Text>
      </View>
      <View style={styles.commentsIconAndText}>
        <CommentBottomArrow
          strokeWidth={2}
          size={20}
          style={bInverted ? pal.textInverted : pal.text}
        />
        <Text type="sm" style={bInverted ? pal.textInverted : pal.text}>
          {commentsCount} comments
        </Text>
      </View>
      <View style={styles.hamburgerButtonStyle}>
        <DotDotDotIcon
          size={20}
          style={bInverted ? pal.textInverted : pal.text}
        />
      </View>
    </View>
  )
}

/////////////////////////////////////////////////////////////////////////////

interface Props {
  groupPost: PostsFeedItemModel
}

// async function delayedLoad(store: RootStoreModel, miniblog: MiniblogModel) {
//   // TODO: Connect to API
//   // Fake delay to simulate fetching ideas from the server
//   return new Promise<void>(resolve => {
//     setTimeout(() => {
//       runInAction(() => {
//         miniblog.load().catch(err => {
//           store.log.error('Failed to fetch miniblog', err)
//         })
//       })
//       resolve()
//     }, 1000)
//   })
// }

export const CardBody_Full = observer(function CardBody_Full({
  groupPost,
}: Props) {
  const pal = usePalette('default')
  const store = useStores()

  const miniblog = useMemo(
    () => groupPost && MiniblogModel.fromFeedItem(store, groupPost),
    [groupPost, store],
  )
  const [isPostLoaded, setIsPostLoaded] = useState<boolean>(false)
  useEffect(() => {
    if (miniblog?.hasLoaded) setIsPostLoaded(true)
  }, [miniblog?.hasLoaded])

  useEffect(() => {
    if (miniblog && !miniblog.hasLoaded && !miniblog.isLoading) {
      // delayedLoad(store, miniblog)
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

  const userPost = groupPost.reply?.root as PostView | undefined
  // const userPost = useMemo(
  //   () => groupPost.reply?.root as PostView | undefined,
  //   [groupPost.reply?.root],
  // )
  const embedInfo = useEmbedInfo(
    userPost?.embed,
    links.reader,
    firstQuote?.asQuote,
  )

  const bShortPost = bodyText.length < LONG_POST_LENGTH
  const likesCount = 12
  const commentsCount = 4

  // TODO: Add logic for variably determining if '... Read more' is required.

  // Get the userInfo so as to render the author's avatar and name.
  const [userInfo, setUserInfo] = useState<ProfileViewBasic>()
  useEffect(() => {
    if (groupPost) {
      const user = (groupPost?.reply?.root as PostView | undefined)?.author
      if (user) setUserInfo(toBasicProfile(user))
    }
  }, [groupPost])

  ////////////////////////////////////////////////////////////////////////
  // Special-case handling for images:
  //   Full image acards with dark gradient over the top 5% and bottom 20%
  //   Inverted Author / postBody / likes&comments rendering overtop the grad.
  if (embedInfo.type === 'image') {
    return (
      <View style={styles.rootContainer}>
        <Link href={links.post} noFeedback>
          <ImageBackground
            resizeMode={'cover'}
            source={{uri: embedInfo.image?.uri}}
            imageStyle={styles.imageBackground}>
            <LinearGradient
              colors={['#00000022', '#00000000', '#00000000', '#00000044']}
              locations={[0.05, 0.1, 0.75, 0.8]}
              style={styles.imageGradient}>
              <PostAuthor userInfo={userInfo} bInverted={true} />
              <View style={styles.imageBottomText}>
                {/* <Link href={links.post} noFeedback> */}
                <FabPickable
                  pickID={'postBody'}
                  // data={miniblog?.richText?.text}
                  // type={'postText'}
                  data={groupPost}
                  type={'UGCBody'}
                  zOrder={10}>
                  <RichText
                    key={`post-card-body`}
                    type={'post-text'}
                    lineHeight={1.6}
                    richText={paragraphs}
                    numberOfLines={3}
                    bInverted={true}
                  />
                  <LikesAndCommentsFooter
                    likesCount={likesCount}
                    commentsCount={commentsCount}
                    bInverted={true}
                  />
                </FabPickable>
                {/* </Link> */}
              </View>
            </LinearGradient>
          </ImageBackground>
        </Link>
      </View>
    )
  }

  ////////////////////////////////////////////////////////////////////////
  // Posts with body, link, quote

  return (
    <View style={[styles.dropShadow, pal.view]}>
      <View style={[styles.bottomContainer]}>
        {/*****************************************************************/}
        <PostAuthor userInfo={userInfo} />

        {/*****************************************************************/}
        <View style={styles.containerMargins}>
          {!isPostLoaded && (
            <View
              style={{
                flexShrink: 1,
                height: '100%',
                marginHorizontal: 16,
              }}>
              <Text>Loading...</Text>
              <ActivityIndicator size="small" color={pal.textLight.color} />
            </View>
          )}
          {isPostLoaded && (
            <Link style={[styles.bodyText]} href={links.post} noFeedback>
              <FabPickable
                pickID={'postBody'}
                // data={miniblog?.richText?.text}
                // type={'postText'}
                data={groupPost}
                type={'UGCBody'}
                zOrder={10}>
                <View style={bShortPost ? styles.columnCenter : undefined}>
                  {true && (
                    <RichText
                      key={`post-card-body`}
                      type={bShortPost ? '4xl' : 'post-text'}
                      style={[pal.text]}
                      lineHeight={1.6}
                      richText={paragraphs}
                      numberOfLines={30}
                    />
                  )}
                </View>
              </FabPickable>
            </Link>
          )}

          {/*****************************************************************/}
          <View style={styles.marginHorizontal16}>
            <FabPickable
              pickID={'postLink'}
              data={embedInfo}
              type={'embedInfo'}
              zOrder={10}>
              <EmbedBlock
                embedInfo={embedInfo}
                imageStyle={styles.maxHeight300}
                containerStyle={[styles.linkContainer, pal.border]}
                fullAxis="width"
              />
            </FabPickable>
          </View>

          {/*****************************************************************/}
          <View style={styles.marginHorizontal16}>
            <LikesAndCommentsFooter
              likesCount={likesCount}
              commentsCount={commentsCount}
            />
          </View>

          {/*****************************************************************/}
        </View>
      </View>
    </View>
  )
})

////////////////////////////////////////////////////////////////////////////////

interface PostAuthorProps {
  userInfo: ProfileViewBasic | undefined
  bInverted?: boolean
}

function PostAuthor({userInfo, bInverted}: PostAuthorProps) {
  const pal = usePalette('default')
  return (
    <Link href={`/profile/${userInfo?.handle}`} asAnchor anchorNoUnderline>
      <FabPickable
        pickID={'postAuthor'}
        data={userInfo}
        type={'userInfo'}
        zOrder={100}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginHorizontal: 16,
            marginTop: 16,
          }}>
          <UserAvatar size={24} avatar={userInfo?.avatar} type="user" />
          <Text type="sm-bold" style={bInverted ? pal.textInverted : pal.text}>
            {userInfo?.displayName || '<unknown>'}
          </Text>
          <View
            style={{
              flexDirection: 'column',
              flex: 1,
              alignItems: 'flex-end',
            }}>
            <Text type="sm" style={[bInverted ? pal.textInverted : pal.text]}>
              Yesterday 10:49pm
            </Text>
          </View>
        </View>
      </FabPickable>
    </Link>
  )
}

////////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  rootContainer: {
    //gap: 10,
    flex: 1,
    flexGrow: 1,
    alignItems: 'stretch',
  },
  aboveFullPost: {
    marginVertical: -10,
    // marginTop: -10, // Required to go right to the top...
    // marginBottom: -10,
    // height: '100%',
  },
  aboveView: {
    marginTop: 10,
    maxHeight: 300,
  },
  imageBackground: {
    borderRadius: 16,
    // Swap these to make the top edge sharp rather than rounded.
    // borderBottomLeftRadius: 16,
    // borderBottomRightRadius: 16,
  },
  imageGradient: {
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    borderRadius: 16,
    // Swap these to make the top edge sharp rather than rounded.
    // borderBottomLeftRadius: 16,
    // borderBottomRightRadius: 16,
  },
  imageBottomText: {
    marginHorizontal: 16,
    marginTop: 16,
    //height: '100%',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'flex-end',
  },
  belowFullWidthView: {
    marginHorizontal: 16,
  },
  portraitImage: {
    flexShrink: 0.5,
    marginTop: 8,
  },
  linkContainer: {
    borderRadius: 8,
    borderWidth: 0.5,
  },
  maxHeight300: {
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
    marginTop: 8,
  },
  marginHorizontal16: {
    marginHorizontal: 16,
  },
  marginTop16: {
    marginTop: 16,
  },
  bodyText: {
    flexShrink: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  columnCenter: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
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
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamburgerButtonStyle: {
    marginLeft: 'auto',
  },
})
