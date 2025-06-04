import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AtpAgent,
  type Facet,
  RichText,
} from '@atproto/api'
import {isViewRecord} from '@atproto/api/dist/client/types/app/bsky/embed/record'
import {isThreadViewPost} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

import {html, renderHandleString} from '../../[handleOrDID].ts'

type Thread = AppBskyFeedDefs.ThreadViewPost

export function expandPostTextRich(
  postView: AppBskyFeedDefs.ThreadViewPost,
): string {
  if (
    !postView.post ||
    AppBskyFeedDefs.isNotFoundPost(postView) ||
    AppBskyFeedDefs.isBlockedPost(postView)
  ) {
    return ''
  }

  const post = postView.post
  const record = post.record
  const embed = post.embed
  const originalText = typeof record?.text === 'string' ? record.text : ''
  const facets = record?.facets as [Facet] | undefined

  let expandedText = originalText

  // Use RichText to process facets if they exist
  if (originalText && facets && facets.length > 0) {
    try {
      const rt = new RichText({text: originalText, facets})
      const modifiedSegmentsText: string[] = []

      for (const segment of rt.segments()) {
        const link = segment.link
        if (
          link &&
          segment.text.endsWith('...') &&
          link.uri.includes(segment.text.slice(0, -3))
        ) {
          // Replace shortened text with full URI
          modifiedSegmentsText.push(link.uri)
        } else {
          // Keep original segment text
          modifiedSegmentsText.push(segment.text)
        }
      }
      expandedText = modifiedSegmentsText.join('')
    } catch (error) {
      console.error('Error processing RichText segments:', error)
      // Fallback to original text on error
      expandedText = originalText
    }
  }

  // Append external link URL if present and not already in text
  if (AppBskyEmbedExternal.isView(embed) && embed.external?.uri) {
    const externalUri = embed.external.uri
    if (!expandedText.includes(externalUri)) {
      expandedText = expandedText
        ? `${expandedText}\n${externalUri}`
        : externalUri
    }
  }

  // Append placeholder for quote posts or other record embeds
  if (
    AppBskyEmbedRecord.isView(embed) ||
    AppBskyEmbedRecordWithMedia.isView(embed)
  ) {
    // no idea why this is needed lol
    const record = embed.record.record ?? embed.record
    if (isViewRecord(record)) {
      const quote = `↘️ quoting ${renderHandleString(record.author)}:\n\n${
        record.value.text
      }`
      expandedText = expandedText ? `${expandedText}\n\n${quote}` : quote
    } else {
      const placeholder = '[quote/embed]'
      if (!expandedText.includes(placeholder)) {
        expandedText = expandedText
          ? `${expandedText}\n\n${placeholder}`
          : placeholder
      }
    }
  }

  // prepend reply header
  if (isThreadViewPost(postView.parent)) {
    const header = `↩️ reply to ${renderHandleString(
      postView.parent.post.author,
    )}:`
    expandedText = expandedText ? `${header}\n\n${expandedText}` : header
  }

  return expandedText
}

class HeadHandler {
  thread: Thread
  url: string
  postTextString: string
  constructor(thread: Thread, url: string, postTextString: string) {
    this.thread = thread
    this.url = url
    this.postTextString = postTextString
  }
  async element(element) {
    const author = this.thread.post.author

    const postText =
      this.postTextString.length > 0
        ? html`
            <meta name="description" content="${this.postTextString}" />
            <meta property="og:description" content="${this.postTextString}" />
          `
        : ''

    const embed = this.thread.post.embed

    const embedElems = !embed
      ? ''
      : AppBskyEmbedImages.isView(embed)
      ? html`${embed.images.map(
            i => html`<meta property="og:image" content="${i.thumb}" />`,
          )}
          <meta name="twitter:card" content="summary_large_image" /> `
      : // TODO: in the future, embed videos
      'thumbnail' in embed && embed.thumbnail
      ? html`
          <meta property="og:image" content="${embed.thumbnail}" />
          <meta name="twitter:card" content="summary_large_image" />
        `
      : html`<meta name="twitter:card" content="summary" />`

    element.append(
      html`
        <meta property="og:site_name" content="blacksky.community" />
        <meta property="og:type" content="article" />
        <meta property="profile:username" content="${author.handle}" />
        <meta property="og:url" content="${this.url}" />
        <meta property="og:title" content="${renderHandleString(author)}" />
        ${postText} ${embedElems}
        <meta name="twitter:label1" content="Account DID" />
        <meta name="twitter:value1" content="${author.did}" />
        <meta
          name="article:published_time"
          content="${this.thread.post.indexedAt}" />
      `,
      {html: true},
    )
  }
}

class TitleHandler {
  thread: Thread
  constructor(thread: Thread) {
    this.thread = thread
  }
  async element(element) {
    element.setInnerContent(renderHandleString(this.thread.post.author))
  }
}

class NoscriptHandler {
  thread: Thread
  postTextString: string
  constructor(thread: Thread, postTextString: string) {
    this.thread = thread
    this.postTextString = postTextString
  }
  async element(element) {
    element.append(
      html`
        <div id="bsky_post_summary">
          <h3>Post</h3>
          <p id="bsky_display_name">
            ${this.thread.post.author.displayName ?? ''}
          </p>
          <p id="bsky_handle">${this.thread.post.author.handle}</p>
          <p id="bsky_did">${this.thread.post.author.did}</p>
          <p id="bsky_post_text">${this.postTextString}</p>
          <p id="bsky_post_indexedat">${this.thread.post.indexedAt}</p>
        </div>
      `,
      {html: true},
    )
  }
}

export async function onRequest(context) {
  const agent = new AtpAgent({service: 'https://public.api.bsky.app/'})
  const {request, env} = context
  const origin = new URL(request.url).origin
  const {handleOrDID, rkey}: {handleOrDID: string; rkey: string} =
    context.params

  const base = env.ASSETS.fetch(new URL('/', origin))
  try {
    const {data} = await agent.getPostThread({
      uri: `at://${handleOrDID}/app.bsky.feed.post/${rkey}`,
      depth: 1,
      parentHeight: 1,
    })
    if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
      throw new Error('Expected a ThreadViewPost')
    }
    const postTextString = expandPostTextRich(data.thread)
    return new HTMLRewriter()
      .on(`head`, new HeadHandler(data.thread, request.url, postTextString))
      .on(`title`, new TitleHandler(data.thread))
      .on(`noscript`, new NoscriptHandler(data.thread, postTextString))
      .transform(await base)
  } catch (e) {
    console.error(e)
    return await base
  }
}
