import {
  AppBskyFeedDefs,
  AppBskyGraphStarterpack,
  ModerationDecision,
} from '@atproto/api'

import {ModeratorData} from '../data/getModeratorData.js'
import {Image as ImageSource, PostData} from '../data/getPostData.js'
import {atoms as a, theme as t} from '../theme/index.js'
import {getModerationCauseInfo} from '../util/getModerationCauseInfo.js'
import {getStarterPackImageUri} from '../util/getStarterPackImageUri.js'
import {Embed, EmbedType, parseEmbed} from '../util/parseEmbed.js'
import {parseEmbedPlayerFromUrl} from '../util/parseEmbedPlayerFromUrl.js'
import {sanitizeHandle} from '../util/sanitizeHandle.js'
import {Box} from './Box.js'
import {FeedCard} from './FeedCard.js'
import * as Grid from './Grid.js'
import {PlayFilled as Play} from './icons/Play.js'
import {StarterPack} from './icons/StarterPack.js'
import {Image, SquareImage} from './Image.js'
import {LinkCard} from './LinkCard.js'
import {ListCard} from './ListCard.js'
import {ModeratedEmbed} from './ModeratedEmbed.js'
import {NotQuotePost, QuotePost} from './PostEmbed/QuotePost.js'
import {Text} from './Text.js'

type CommonProps = {
  data: PostData
  moderation: ModerationDecision
  moderatorData: ModeratorData
  hideNestedEmbeds?: boolean
}

export function PostEmbed({
  embed: rawEmbed,
  ...rest
}: CommonProps & {
  embed: AppBskyFeedDefs.PostView['embed']
}) {
  const embed = parseEmbed(rawEmbed)

  switch (embed.type) {
    case 'images':
    case 'link':
    case 'video':
      return <MediaEmbeds embed={embed} {...rest} />
    case 'feed':
    case 'list':
    case 'starter_pack':
    case 'post':
    case 'post_blocked':
    case 'post_detached':
    case 'post_not_found':
      return <RecordEmbeds embed={embed} {...rest} />
    case 'post_with_media':
      return (
        <Box cx={[a.gap_md]}>
          <MediaEmbeds embed={embed.media} {...rest} />
          {!rest.hideNestedEmbeds && (
            <RecordEmbeds embed={embed.view} {...rest} hideNestedEmbeds />
          )}
        </Box>
      )
    default:
      return null
  }
}

export function MediaEmbeds({
  embed,
  ...rest
}: CommonProps & {
  embed: Embed
}) {
  switch (embed.type) {
    case 'images': {
      return <ImagesEmbed embed={embed} {...rest} />
    }
    case 'link': {
      return <LinkEmbed embed={embed} {...rest} />
    }
    case 'video': {
      return <VideoEmbed embed={embed} {...rest} />
    }
    default:
      return null
  }
}

export function RecordEmbeds({
  embed,
  ...rest
}: CommonProps & {
  embed: Embed
}) {
  switch (embed.type) {
    case 'feed': {
      return <FeedEmbed embed={embed} {...rest} />
    }
    case 'list': {
      return <ListEmbed embed={embed} {...rest} />
    }
    case 'starter_pack': {
      return <StarterPackEmbed embed={embed} {...rest} />
    }
    case 'post': {
      return <QuoteEmbed embed={embed} {...rest} />
    }
    case 'post_blocked': {
      return <NotQuotePost>Quoted post is blocked</NotQuotePost>
    }
    case 'post_detached': {
      return <NotQuotePost>Quoted post detached by author</NotQuotePost>
    }
    case 'post_not_found': {
      return (
        <NotQuotePost>
          Quoted post not found, it may have been deleted.
        </NotQuotePost>
      )
    }
  }
}

export function QuoteEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'post'>
}) {
  return <QuotePost embed={embed.view} {...rest} />
}

export function StarterPackEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'starter_pack'>
}) {
  const uri = getStarterPackImageUri(embed.view)
  if (!AppBskyGraphStarterpack.isValidRecord(embed.view.record)) return null
  const {name, description} = embed.view.record
  const image = rest.data.images.get(uri)
  return (
    <Box
      cx={[
        a.w_full,
        a.rounded_sm,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      {image && (
        <Box
          cx={[
            a.relative,
            a.w_full,
            t.atoms.bg_contrast_25,
            {paddingTop: (630 / 1200) * 100 + '%'},
          ]}>
          <Image
            image={image}
            cx={[
              a.absolute,
              a.inset_0,
              {
                objectFit: 'cover',
              },
            ]}
          />
        </Box>
      )}
      <Box cx={[a.px_md, a.py_sm, t.atoms.bg]}>
        <Box cx={[a.w_full, a.gap_xs]}>
          <Box cx={[a.flex_row, a.align_center, a.gap_xs, a.w_full]}>
            <StarterPack size={40} fill={t.palette.primary_500} />
            <Box cx={[a.flex_1]}>
              <Text cx={[a.text_sm, a.font_bold, a.leading_snug]}>{name}</Text>
              <Text
                cx={[a.leading_snug, a.text_xs, t.atoms.text_contrast_medium]}>
                Starter pack by {sanitizeHandle(embed.view.creator.handle, '@')}
              </Text>
            </Box>
          </Box>
          {description ? (
            <Text cx={[a.leading_snug, a.text_xs]}>{description}</Text>
          ) : null}
          {embed.view.joinedAllTimeCount >= 50 && (
            <Text cx={[a.font_bold, a.text_xs, t.atoms.text_contrast_medium]}>
              {embed.view.joinedAllTimeCount} users have joined!
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export function ListEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  return (
    <ListCard
      embed={embed.view}
      data={rest.data}
      moderatorData={rest.moderatorData}
    />
  )
}

export function FeedEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  return (
    <FeedCard
      embed={embed.view}
      data={rest.data}
      moderatorData={rest.moderatorData}
    />
  )
}

export function LinkEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'link'>
}) {
  const {title, description, uri, thumb} = embed.view.external
  if (!thumb) return null
  const image = rest.data.images.get(thumb)
  const player = parseEmbedPlayerFromUrl(uri)
  const gif = rest.data.images.get(player?.playerUri)
  if (gif) {
    return (
      <Box cx={[a.rounded_sm, a.overflow_hidden]}>
        <Image image={gif} />
        <Box
          cx={[
            a.absolute,
            a.inset_0,
            {
              top: '75%',
              backgroundImage:
                'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.75))',
            },
          ]}
        />
        <Box
          cx={[
            a.absolute,
            a.rounded_xs,
            a.px_xs,
            a.py_2xs,
            {
              backgroundColor: t.palette.contrast_25,
              bottom: a.p_md.padding,
              right: a.p_md.padding,
            },
          ]}>
          <Text cx={[t.atoms.text, a.font_heavy, a.text_sm]}>GIF</Text>
        </Box>
      </Box>
    )
  }
  return (
    <LinkCard image={image} title={title} description={description} uri={uri} />
  )
}

export function VideoEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'video'>
}) {
  const {thumbnail} = embed.view
  const modui = rest.moderation.ui('contentMedia')
  const info = getModerationCauseInfo({
    cause: modui.blurs.at(0),
    moderatorData: rest.moderatorData,
  })

  if (info) {
    return <ModeratedEmbed info={info} />
  }

  const img = rest.data.images.get(thumbnail)
  if (img) {
    return (
      <Box cx={[a.relative, a.rounded_sm, a.w_full, a.overflow_hidden]}>
        <Image image={img} />
        <Box
          cx={[
            a.absolute,
            a.inset_0,
            a.rounded_full,
            {
              margin: 'auto',
              width: '48px',
              height: '48px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            },
          ]}>
          <Box
            cx={[
              a.align_center,
              a.justify_center,
              a.absolute,
              a.inset_0,
              a.rounded_full,
              {
                margin: 'auto',
                width: '48px',
                height: '48px',
                backgroundColor: t.palette.contrast_25,
                opacity: 0.7,
              },
            ]}>
            <Play size={32} />
          </Box>
        </Box>
      </Box>
    )
  } else {
    return null
  }
}

export function ImagesEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'images'>
}) {
  const gutter = a.p_2xs.padding
  const {images} = embed.view
  const modui = rest.moderation.ui('contentMedia')
  const info = getModerationCauseInfo({
    cause: modui.blurs.at(0),
    moderatorData: rest.moderatorData,
  })

  if (info) {
    return <ModeratedEmbed info={info} />
  }

  if (images.length > 0) {
    const imgs = images
      .map(({fullsize}) => rest.data.images.get(fullsize))
      .filter(Boolean) as ImageSource[]
    if (imgs.length === 1) {
      return (
        <Box cx={[a.rounded_sm, a.w_full, a.overflow_hidden]}>
          <Image image={imgs[0]} />
        </Box>
      )
    } else if (imgs.length === 2) {
      return (
        <Grid.Row gutter={gutter}>
          <Grid.Column width={1 / 2} gutter={gutter}>
            <SquareImage
              image={imgs[0]}
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
            />
          </Grid.Column>
          <Grid.Column width={1 / 2} gutter={gutter}>
            <SquareImage
              image={imgs[1]}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
              insetBorderStyle={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
            />
          </Grid.Column>
        </Grid.Row>
      )
    } else if (imgs.length === 3) {
      return (
        <Grid.Row gutter={gutter}>
          <Grid.Column gutter={gutter} width={2 / 3}>
            <SquareImage
              image={imgs[0]}
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
            />
          </Grid.Column>
          <Grid.Column gutter={gutter} width={1 / 3} cx={[a.gap_xs]}>
            <SquareImage
              image={imgs[1]}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            />
            <SquareImage
              image={imgs[2]}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
            />
          </Grid.Column>
        </Grid.Row>
      )
    } else {
      return (
        <Grid.Row gutter={gutter}>
          <Grid.Column gutter={gutter} width={1 / 2} cx={[a.gap_xs]}>
            <SquareImage
              image={imgs[0]}
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
              }}
              insetBorderStyle={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                borderBottomLeftRadius: 0,
              }}
            />
            <SquareImage
              image={imgs[2]}
              style={{
                borderTopLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
              }}
            />
          </Grid.Column>
          <Grid.Column gutter={gutter} width={1 / 2} cx={[a.gap_xs]}>
            <SquareImage
              image={imgs[1]}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            />
            <SquareImage
              image={imgs[3]}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
              insetBorderStyle={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
            />
          </Grid.Column>
        </Grid.Row>
      )
    }
  }
}
