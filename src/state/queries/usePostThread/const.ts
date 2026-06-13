// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {type AppBskyUnspeccedGetPostThreadV2} from '@atproto/api'

/**
 * See the `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const LINEAR_VIEW_BELOW = 10

/**
 * See the `branchingFactor` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const LINEAR_VIEW_BF = 1

/**
 * See the `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const TREE_VIEW_BELOW = 4

/**
 * See the `branchingFactor` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const TREE_VIEW_BF = undefined

/**
 * See the `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const TREE_VIEW_BELOW_DESKTOP = 6

/**
 * Reader view anchors at the thread root and reads the OP chain straight
 * down, so it requests the maximum depth the endpoint allows. See the
 * `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 *
 * Reader view fetches with branchingFactor 1 ({@link LINEAR_VIEW_BF}); the
 * seam transform relies on that, see `createSeam` in PostThread/reader.ts.
 */
export const READER_VIEW_BELOW = 20
