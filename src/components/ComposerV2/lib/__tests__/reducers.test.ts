import {describe, expect, test} from '@jest/globals'

import * as reducers from '#/components/ComposerV2/lib/reducers'
import {
  type ComposerState,
  type GifItem,
  type VideoItem,
} from '#/components/ComposerV2/lib/types'

function makeState(): ComposerState {
  return reducers.createInitialState({rootPostId: 'p1'})
}

function makeVideo(id = 'v1'): VideoItem {
  return {
    id,
    uri: 'file:///video.mp4',
    width: 100,
    height: 100,
    altText: '',
    mimeType: 'video/mp4',
    localRefPath: `video:video/mp4:${id}`,
    captions: [],
    upload: {state: 'pending'},
  }
}

function makeGif(id = 'g1'): GifItem {
  return {
    id,
    altText: '',
    // The Gif type from tenor is large; for reducer tests the store doesn't
    // inspect any of those fields, so we cast a minimal shape.
    gif: {url: 'https://example.com/gif'} as GifItem['gif'],
  }
}

describe('createInitialState', () => {
  test('starts with one empty post', () => {
    const s = reducers.createInitialState({rootPostId: 'root'})
    expect(s.posts).toHaveLength(1)
    expect(s.posts[0].id).toBe('root')
    expect(s.posts[0].text).toBe('')
    expect(s.isDirty).toBe(false)
  })

  test('captures replyTo and draftId when provided', () => {
    const s = reducers.createInitialState({
      rootPostId: 'root',
      replyTo: {uri: 'at://x', cid: 'c', authorDid: 'did:plc:a'},
      draftId: 'draft-1',
    })
    expect(s.replyTo?.uri).toBe('at://x')
    expect(s.draftId).toBe('draft-1')
  })
})

describe('updateText', () => {
  test('sets text on the matching post and marks dirty', () => {
    const s = reducers.updateText(makeState(), {postId: 'p1', text: 'hello'})
    expect(s.posts[0].text).toBe('hello')
    expect(s.isDirty).toBe(true)
  })

  test('returns identical reference when text unchanged', () => {
    const s1 = makeState()
    const s2 = reducers.updateText(s1, {postId: 'p1', text: ''})
    expect(s2).toBe(s1)
  })

  test('leaves state unchanged when post id is unknown', () => {
    const s1 = makeState()
    const s2 = reducers.updateText(s1, {postId: 'nope', text: 'hi'})
    expect(s2).toBe(s1)
  })
})

describe('appendPost / insertPostAfter / removePost', () => {
  test('appendPost adds a post at the end', () => {
    const s = reducers.appendPost(makeState(), {id: 'p2'})
    expect(s.posts.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(s.isDirty).toBe(true)
  })

  test('insertPostAfter places a post immediately after the target', () => {
    let s = reducers.appendPost(makeState(), {id: 'p2'})
    s = reducers.appendPost(s, {id: 'p3'})
    s = reducers.insertPostAfter(s, {afterId: 'p1', id: 'p1b'})
    expect(s.posts.map(p => p.id)).toEqual(['p1', 'p1b', 'p2', 'p3'])
  })

  test('insertPostAfter is a no-op for an unknown afterId', () => {
    const s1 = makeState()
    const s2 = reducers.insertPostAfter(s1, {afterId: 'nope', id: 'x'})
    expect(s2).toBe(s1)
  })

  test('removePost removes the matching post', () => {
    let s = reducers.appendPost(makeState(), {id: 'p2'})
    s = reducers.appendPost(s, {id: 'p3'})
    s = reducers.removePost(s, {postId: 'p2'})
    expect(s.posts.map(p => p.id)).toEqual(['p1', 'p3'])
  })

  test('removePost is a no-op for an unknown post id', () => {
    const s1 = reducers.appendPost(makeState(), {id: 'p2'})
    const s2 = reducers.removePost(s1, {postId: 'nope'})
    expect(s2).toBe(s1)
  })

  test('removePost refuses to remove the last remaining post', () => {
    const s1 = makeState()
    const s2 = reducers.removePost(s1, {postId: 'p1'})
    expect(s2).toBe(s1)
    expect(s2.posts).toHaveLength(1)
  })
})

describe('image media', () => {
  test('addImages appends images with pending upload status', () => {
    const s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {
          id: 'i1',
          uri: 'file:///a.jpg',
          width: 1,
          height: 1,
          localRefPath: 'image:i1',
        },
      ],
    })
    expect(s.posts[0].media?.kind).toBe('images')
    if (s.posts[0].media?.kind !== 'images') return
    expect(s.posts[0].media.items).toHaveLength(1)
    expect(s.posts[0].media.items[0].upload.state).toBe('pending')
  })

  test('addImages a second time appends rather than replacing', () => {
    let s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
      ],
    })
    s = reducers.addImages(s, {
      postId: 'p1',
      images: [
        {id: 'i2', uri: 'b', width: 1, height: 1, localRefPath: 'image:i2'},
      ],
    })
    if (s.posts[0].media?.kind !== 'images') throw new Error('expected images')
    expect(s.posts[0].media.items.map(i => i.id)).toEqual(['i1', 'i2'])
  })

  test('removeImage removes the matching image and clears media when last one is gone', () => {
    let s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
      ],
    })
    s = reducers.removeImage(s, {postId: 'p1', imageId: 'i1'})
    expect(s.posts[0].media).toBeUndefined()
  })

  test('updateImageAltText updates only the matching image', () => {
    let s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
        {id: 'i2', uri: 'b', width: 1, height: 1, localRefPath: 'image:i2'},
      ],
    })
    s = reducers.updateImageAltText(s, {
      postId: 'p1',
      imageId: 'i2',
      altText: 'hello',
    })
    if (s.posts[0].media?.kind !== 'images') throw new Error('expected images')
    expect(s.posts[0].media.items[0].altText).toBe('')
    expect(s.posts[0].media.items[1].altText).toBe('hello')
  })
})

describe('video and gif media', () => {
  test('setVideo replaces any existing media with the video', () => {
    let s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
      ],
    })
    s = reducers.setVideo(s, {postId: 'p1', video: makeVideo()})
    expect(s.posts[0].media?.kind).toBe('video')
  })

  test('removeVideo only removes when current media is a video', () => {
    let s = reducers.setGif(makeState(), {postId: 'p1', gif: makeGif()})
    s = reducers.removeVideo(s, {postId: 'p1'})
    expect(s.posts[0].media?.kind).toBe('gif')
  })

  test('setGif replaces any existing media with a gif', () => {
    let s = reducers.setVideo(makeState(), {postId: 'p1', video: makeVideo()})
    s = reducers.setGif(s, {postId: 'p1', gif: makeGif()})
    expect(s.posts[0].media?.kind).toBe('gif')
  })
})

describe('external link and quote', () => {
  test('setExternal stores a link card and removeExternal clears it', () => {
    let s = reducers.setExternal(makeState(), {
      postId: 'p1',
      external: {uri: 'https://example.com'},
    })
    expect(s.posts[0].external?.uri).toBe('https://example.com')
    s = reducers.removeExternal(s, {postId: 'p1'})
    expect(s.posts[0].external).toBeUndefined()
  })

  test('setQuote stores a quote and removeQuote clears it', () => {
    let s = reducers.setQuote(makeState(), {
      postId: 'p1',
      quote: {uri: 'at://x', cid: 'c'},
    })
    expect(s.posts[0].quote?.uri).toBe('at://x')
    s = reducers.removeQuote(s, {postId: 'p1'})
    expect(s.posts[0].quote).toBeUndefined()
  })
})

describe('updateLabels', () => {
  test('replaces the labels array on the matching post', () => {
    const s = reducers.updateLabels(makeState(), {
      postId: 'p1',
      labels: ['sexual', 'graphic-media'],
    })
    expect(s.posts[0].labels).toEqual(['sexual', 'graphic-media'])
  })
})

describe('setUploadStatus', () => {
  test('updates the upload field on the matching image', () => {
    let s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
      ],
    })
    s = reducers.setUploadStatus(s, {
      mediaId: 'i1',
      status: {state: 'uploading', progress: 0.5},
    })
    if (s.posts[0].media?.kind !== 'images') throw new Error('expected images')
    expect(s.posts[0].media.items[0].upload).toEqual({
      state: 'uploading',
      progress: 0.5,
    })
  })

  test('updates the upload field on a video', () => {
    let s = reducers.setVideo(makeState(), {postId: 'p1', video: makeVideo()})
    s = reducers.setUploadStatus(s, {
      mediaId: 'v1',
      status: {state: 'failed', error: 'boom'},
    })
    if (s.posts[0].media?.kind !== 'video') throw new Error('expected video')
    expect(s.posts[0].media.item.upload).toEqual({
      state: 'failed',
      error: 'boom',
    })
  })

  test('returns identical state when the media id is unknown', () => {
    const s1 = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
      ],
    })
    const s2 = reducers.setUploadStatus(s1, {
      mediaId: 'gone',
      status: {state: 'uploading', progress: 0.5},
    })
    expect(s2).toBe(s1)
  })

  test('does not mark the state dirty (background upload progress is not a user edit)', () => {
    let s = reducers.addImages(makeState(), {
      postId: 'p1',
      images: [
        {id: 'i1', uri: 'a', width: 1, height: 1, localRefPath: 'image:i1'},
      ],
    })
    // Reset dirty so we're isolating setUploadStatus' behavior.
    s = {...s, isDirty: false}
    const s2 = reducers.setUploadStatus(s, {
      mediaId: 'i1',
      status: {state: 'uploading', progress: 0.25},
    })
    expect(s2.isDirty).toBe(false)
  })
})
