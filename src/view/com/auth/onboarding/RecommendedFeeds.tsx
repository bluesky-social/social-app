import 'react'
import {withBreakpoints} from 'view/com/util/layouts/withBreakpoints'
import {RecommendedFeedsDesktop} from './RecommendedFeedsDesktop'
import {RecommendedFeedsTablet} from './RecommendedFeedsTablet'
import {RecommendedFeedsMobile} from './RecommendedFeedsMobile'

export const RecommendedFeeds = withBreakpoints(
  RecommendedFeedsMobile,
  RecommendedFeedsTablet,
  RecommendedFeedsDesktop,
)
