/**
 * Bluesky's Facebook App ID. Instagram rejects stories shared without a
 * registered one. It isn't secret: it's sent in the URL that opens Instagram.
 */
export const FACEBOOK_APP_ID = '1462816708729552'

/*
 * The image is laid out at a third of Instagram's 1080x1920 story size, then
 * captured at 3x.
 */
export const STORY_WIDTH = 360
export const STORY_HEIGHT = 640
export const STORY_PIXEL_RATIO = 3

/** The exported image's size in pixels. */
export const IMAGE_WIDTH = STORY_WIDTH * STORY_PIXEL_RATIO
export const IMAGE_HEIGHT = STORY_HEIGHT * STORY_PIXEL_RATIO

/** The sky behind the post: blue by day, starry at night. */
export type StorySky = 'day' | 'night'

/**
 * Where the screen was opened from. `story` ends in Instagram Stories; `image`
 * shares or saves the picture itself.
 */
export type PostImageMode = 'story' | 'image'
