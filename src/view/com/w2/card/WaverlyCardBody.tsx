import React from 'react'
import {View, StyleSheet} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {DotDotDotIcon} from 'lib/icons-w2'
import {Link} from '../../util/Link'
import {RichText as RichTextObj} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {RichText} from 'view/com/util/text/RichText'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {EmbedBlock} from './EmbedBlock'
import {Recommendation} from 'w2-api/waverly_sdk'
import {colors, s} from 'lib/styles'
import {IsQuote} from '../util/Quote'

const LONG_POST_LENGTH = 200

interface CBProps {
  text: string
  href: string
}

export const CommunityButton = ({text, href}: CBProps) => {
  const pal = usePalette('primary')
  return (
    <Link
      style={[styles.communityButton, pal.viewInverted]}
      href={href}
      noFeedback>
      <Text type="lg" style={[pal.textInverted]}>
        {text}
      </Text>
    </Link>
  )
}

function WaverlyFooter({hoursToGo, href}: {hoursToGo: number; href: string}) {
  const pal = usePalette('default')

  return (
    <View style={styles.likesAndCommentsContainer}>
      <View style={styles.circle}>
        <View style={styles.hoursCounter}>
          <Text type="md" style={(s.flex1, s.textCenter, pal.text)}>
            {hoursToGo}h
          </Text>
        </View>
      </View>
      <CommunityButton text={'Add to Wave'} href={href} />
      <View style={styles.hamburgerButtonStyle}>
        <DotDotDotIcon size={20} style={pal.text} />
      </View>
    </View>
  )
}

interface Props {
  rec: Recommendation
}

export const WaverlyCardBody = observer(function WaverlyCardBody({rec}: Props) {
  const pal = usePalette('default')
  //const store = useStores()

  // TODO
  // const userPost = useMemo(
  //   () => groupPost.reply?.root as PostView | undefined,
  //   [groupPost.reply?.root],
  // )

  // TODO
  // const links = useMemo(() => {
  //   const handle = groupPost.post.author.handle
  //   const rkey = new AtUri(groupPost.post.uri).rkey
  //   return {
  //     post: `/profile/${handle}/w/${rkey}`,
  //     reader: `/profile/${handle}/reader/${rkey}`,
  //   }
  // }, [groupPost.post])
  const link = `/recommendation/${rec.id}`
  const links = {post: link, reader: link}

  const miniblogText = rec.summary // Repalces miniblog?.richText?.text
  const bodyText = rec.summary ?? ''

  // Make a list of all paragraphs in the post that are a quote.
  let quoteList: string[] = []
  if (miniblogText)
    miniblogText.split('\n').forEach(a => {
      const q = IsQuote(a)
      if (q.bIsQuote) quoteList.push(q.asQuote as string)
    })

  // TODO: for now, we're only comparing against the first quote block.
  const firstQuote = quoteList.length > 0 ? quoteList[0] : undefined

  // Strip away quote blocks, leaving only non-quote paragraphs.
  const paragraphs = miniblogText
    ? new RichTextObj({
        text: miniblogText
          .split('\n')
          .filter(text => !firstQuote || text !== firstQuote)
          .join('\n\n'),
        facets: undefined,
      })
    : undefined

  // TODO
  //const embedInfo = useEmbedInfo(userPost?.embed, links.reader, firstQuote)

  const externalURI = rec.href
  const host = new URL(externalURI).host
  const length = '4 min'
  const embedInfo: EmbedInfo =
    // {type: 'none'}
    {
      type: 'link',
      image: rec.og_image ? {uri: rec.og_image} : undefined,
      link: {
        title: rec.title,
        description: rec.summary,
        length: length,
        host: host,
        uri: links.reader,
        originalUri: externalURI,
      },
      quote: firstQuote,
    }

  // Put image outside if this this is a short post
  const embedLoc =
    embedInfo.type === 'link'
      ? 'inside-below'
      : embedInfo.type === 'youtube' || bodyText.length < LONG_POST_LENGTH
      ? 'outside'
      : 'inside-above'

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
                <RichText
                  key={`waverly-card-body`}
                  type="post-text"
                  style={[pal.text]}
                  lineHeight={1.6}
                  richText={paragraphs}
                />
              </Link>
            )}
            {embedLoc === 'inside-below' && (
              <EmbedBlock
                embedInfo={embedInfo}
                imageStyle={styles.linkImage}
                containerStyle={[styles.linkContainer, pal.border]}
                fullAxis="width"
              />
            )}
            <WaverlyFooter hoursToGo={16} href={links.post} />
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
    gap: 15,
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamburgerButtonStyle: {
    marginLeft: 'auto',
  },
  communityButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 7,
  },
  circle: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.waverly1,
  },
  hoursCounter: {
    flex: 1,
    height: 36,
    width: 36,
    padding: 4,
    justifyContent: 'center',
    borderColor: colors.waverly1,
  },
})
