#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ScrollForwarderViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(scrollViewTag, NSString)
RCT_EXPORT_VIEW_PROPERTY(onScrollViewRefresh, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(scrollViewRefreshing, BOOL)

@end
