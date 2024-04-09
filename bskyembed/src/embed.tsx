import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphDefs,
} from '@atproto/api'
import {h} from 'preact'

export function Embed({content}: {content: AppBskyFeedDefs.PostView['embed']}) {
  if (!content) return null

  try {
    // Case 1: Image
    if (AppBskyEmbedImages.isView(content)) {
      return <ImageEmbed content={content} />
    }

    //   // Case 2: External link
    //   if (AppBskyEmbedExternal.isView(content)) {
    //     return <ExternalEmbed content={content} />
    //   }

    //   // Case 3: Record (quote or linked post)
    //   if (AppBskyEmbedRecord.isView(content)) {
    //     const record = content.record

    //     // Case 3.1: Post
    //     if (AppBskyEmbedRecord.isViewRecord(record)) {
    //       let text
    //       if (AppBskyFeedPost.isRecord(record.value)) {
    //         text = record.value.text
    //       }
    //       return (
    //         <div className="mt-1.5">
    //           <PostEmbed post={record}>
    //             {text && <p className="mt-1 text-base leading-5">{text}</p>}
    //             {record.embeds?.map(embed => (
    //               <Embed key={embed.$type} content={embed} />
    //             ))}
    //           </PostEmbed>
    //         </div>
    //       )
    //     }

    //     // Case 3.2: List
    //     if (AppBskyGraphDefs.isListView(record)) {
    //       return <ListEmbed list={record} />
    //     }

    //     // Case 3.3: Feed
    //     if (AppBskyFeedDefs.isGeneratorView(record)) {
    //       return <FeedGeneratorEmbed generator={record} />
    //     }

    //     // Case 3.4: Post not found
    //     if (AppBskyEmbedRecord.isViewNotFound(record)) {
    //       return <ViewNotFound />
    //     }

    //     throw new Error('Unsupported record type')
    //   }

    //   // Case 4: Record with media
    //   if (AppBskyEmbedRecordWithMedia.isView(content)) {
    //     return (
    //       <div className="mt-1.5 flex flex-col gap-x-1.5">
    //         <Embed content={content.media} />
    //         <Embed
    //           content={{
    //             $type: 'app.bsky.embed.record#view',
    //             record: content.record.record,
    //           }}
    //         />
    //       </div>
    //     )
    //   }

    throw new Error('Unsupported embed type')
  } catch (err) {
    // console.error("Error rendering embed", content);
    return (
      <div className="mt-1.5 flex-1 flex-row items-center rounded-lg border py-2">
        <p className="ml-2">
          {err instanceof Error ? err.message : 'An error occurred'}
        </p>
      </div>
    )
  }
}

const ImageEmbed = ({content}: {content: AppBskyEmbedImages.View}) => {
  switch (content.images.length) {
    case 1:
      return (
        <img
          src={content.images[0].thumb}
          className="w-full rounded-lg overflow-hidden object-cover h-auto max-h-[1000px]"
        />
      )
    case 2:
      return (
        <div className="flex gap-1 rounded-lg overflow-hidden w-full aspect-[2/1]">
          {content.images.map((image, i) => (
            <img
              key={i}
              src={image.thumb}
              className="w-1/2 h-full object-cover rounded-sm"
            />
          ))}
        </div>
      )
    case 3:
      return (
        <div className="flex gap-1 rounded-lg overflow-hidden w-full aspect-[2/1]">
          <img
            src={content.images[0].thumb}
            className="flex-[3] object-cover rounded-sm"
          />
          <div className="flex flex-col gap-1 flex-[2]">
            {content.images.slice(1).map((image, i) => (
              <img
                key={i}
                src={image.thumb}
                className="w-full h-full object-cover rounded-sm"
              />
            ))}
          </div>
        </div>
      )
    case 4:
      return (
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
          {content.images.map((image, i) => (
            <img
              key={i}
              src={image.thumb}
              className="aspect-square w-full object-cover rounded-sm"
            />
          ))}
        </div>
      )
    default:
      return null
  }
}
