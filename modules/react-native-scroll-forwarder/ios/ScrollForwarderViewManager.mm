#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"

@interface ScrollForwarderViewManager : RCTViewManager
@end

@implementation ScrollForwarderViewManager

RCT_EXPORT_MODULE(ScrollForwarderView)

- (UIView *)view
{
  return [[UIView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(scrollViewTag, NSNumber)

@end
