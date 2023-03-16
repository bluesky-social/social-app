import React from 'react'
import {FeedSliceModel} from 'state/models/feed-view'
import {FeedItem} from './FeedItem'

export function FeedSlice({
  slice,
  showFollowBtn,
  ignoreMuteFor,
}: {
  slice: FeedSliceModel
  showFollowBtn?: boolean
  ignoreMuteFor?: string
}) {
  return (
    <>
      {slice.items.map((item, i) => (
        <FeedItem
          key={item._reactKey}
          item={item}
          isThreadParent={slice.isThreadParentAt(i)}
          isThreadChild={slice.isThreadChildAt(i)}
          showFollowBtn={showFollowBtn}
          ignoreMuteFor={ignoreMuteFor}
        />
      ))}
    </>
  )
}
