import {
  AppBskyFeedDefs,
  AppBskyGraphStarterpack,
  ModerationDecision,
} from '@atproto/api'

import {ModeratorData} from '../data/getModeratorData.js'
import {Image as ImageSource, PostData} from '../data/getPostData.js'
import {atoms as a} from '../theme/index.js'
import {getStarterPackImageUri} from '../util/getStarterPackImageUri.js'
import {Embed, EmbedType,parseEmbed} from '../util/parseEmbed.js'
import {Box} from './Box.js'
import {FeedCard} from './FeedCard.js'
import * as Grid from './Grid.js'
import {Image, SquareImage} from './Image.js'
import {LinkCard} from './LinkCard.js'
import {ListCard} from './ListCard.js'
import {NotQuotePost,QuotePost} from './PostEmbed/QuotePost.js'

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
      return null
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
  return <LinkCard image={image} title={name} description={description} />
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
  return (
    <LinkCard image={image} title={title} description={description} uri={uri} />
  )
}

export function ImagesEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: EmbedType<'images'>
}) {
  const {images} = embed.view

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
        <Grid.Row gutter={a.p_xs.padding}>
          <Grid.Column gutter={a.p_xs.padding} width={1 / 2}>
            <SquareImage image={imgs[0]} />
          </Grid.Column>
          <Grid.Column gutter={a.p_xs.padding} width={1 / 2}>
            <SquareImage image={imgs[1]} />
          </Grid.Column>
        </Grid.Row>
      )
    } else if (imgs.length === 3) {
      return (
        <Grid.Row gutter={a.p_xs.padding}>
          <Grid.Column gutter={a.p_xs.padding} width={2 / 3}>
            <SquareImage image={imgs[0]} />
          </Grid.Column>
          <Grid.Column gutter={a.p_xs.padding} width={1 / 3} cx={[a.gap_sm]}>
            <SquareImage image={imgs[1]} />
            <SquareImage image={imgs[2]} />
          </Grid.Column>
        </Grid.Row>
      )
    } else {
      return (
        <Grid.Row gutter={a.p_xs.padding}>
          <Grid.Column gutter={a.p_xs.padding} width={1 / 2} cx={[a.gap_sm]}>
            <SquareImage image={imgs[0]} />
            <SquareImage image={imgs[1]} />
          </Grid.Column>
          <Grid.Column gutter={a.p_xs.padding} width={1 / 2} cx={[a.gap_sm]}>
            <SquareImage image={imgs[2]} />
            <SquareImage image={imgs[3]} />
          </Grid.Column>
        </Grid.Row>
      )
    }
  }
}
