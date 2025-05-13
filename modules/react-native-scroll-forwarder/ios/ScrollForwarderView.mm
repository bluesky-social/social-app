#import "ScrollForwarderView.h"

#import <React/RCTEnhancedScrollView.h>
#import <React/RCTScrollViewComponentView.h>
#import <react/renderer/components/ScrollForwarderViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ScrollForwarderViewSpec/EventEmitters.h>
#import <react/renderer/components/ScrollForwarderViewSpec/Props.h>
#import <react/renderer/components/ScrollForwarderViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

// How far down a pull needs to be to trigger a refresh
static const CGFloat kPullThreshold = 130.0;
static const CGFloat kDampingFactor = 0.55;
// The top speed that free scrolling can have
static const CGFloat kMaxVelocity = 5000.0;
// Free scrolling decay. This seems to be close to the default iOS value
static const CGFloat kVelocityDecay = 0.9875;
// What scroll release velocity will actually trigger free scrolling
static const CGFloat kMinimumVelocity = 5.0;

@interface ScrollForwarderView () <RCTScrollForwarderViewViewProtocol, UIGestureRecognizerDelegate>

@end

@implementation ScrollForwarderView {
  NSArray<UIGestureRecognizer *> * _cancelGestureRecognizers;
  RCTScrollViewComponentView * _svcv;
  CGPoint _initialOffset;
  
  CADisplayLink * _displayLink;
  CGFloat _currentVelocity;
  CGFloat _accumulatedTranslation;
  
  bool _didImpact;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollForwarderViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ScrollForwarderViewProps>();
    _props = defaultProps;
    
    UIPanGestureRecognizer *pg = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handlePan:)];
    pg.delegate = self;
    pg.cancelsTouchesInView = false;
    [self addGestureRecognizer:pg];
    
    UITapGestureRecognizer *tg = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTap:)];
    [tg setEnabled:false];
    tg.delegate = self;
    
    UILongPressGestureRecognizer *lpg = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handleLongPress:)];
    [lpg setMinimumPressDuration:0.01];
    [lpg setEnabled:false];
    lpg.delegate = self;
    
    NSArray<UIGestureRecognizer *> *cancelGestureRecognizers = [NSArray arrayWithObjects:lpg, tg, nil];
    _cancelGestureRecognizers = cancelGestureRecognizers;
  }

  return self;
}

// MARK: - Lifecycle

- (void)dealloc
{
  [self stopAnimation];
  [self removeCancelGestureRecognizers];
  _svcv = nil;
  
  for (UIGestureRecognizer *gr in _cancelGestureRecognizers) {
    gr.delegate = nil;
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self stopAnimation];
  [self removeCancelGestureRecognizers];
  _svcv = nil;
}

// MARK: - Props

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<ScrollForwarderViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<ScrollForwarderViewProps const>(props);

  if (oldViewProps.scrollViewTag != newViewProps.scrollViewTag) {
    [self tryFindScrollView];
  }
  
  if (oldViewProps.refreshing != newViewProps.refreshing) {
    if (!newViewProps.refreshing) {
      [self endRefreshing];
    }
  }
  
  [super updateProps:props oldProps:oldProps];
}

// MARK: - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  if ([gestureRecognizer isKindOfClass:[UIPanGestureRecognizer class]] && [otherGestureRecognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
    return NO;
  }
  
  return YES;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  if (![gestureRecognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
    return YES;
  }
  
  UIPanGestureRecognizer *pg = (UIPanGestureRecognizer *)gestureRecognizer;
  CGPoint velocity = [pg velocityInView:self];
  
  return fabs(velocity.y) > fabs(velocity.x);
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [self stopAnimation];
  [super touchesBegan:touches withEvent:event];
}

// MARK: - Scroll Forwarding

- (void)removeCancelGestureRecognizers
{
  if (!_svcv) return;
  for (UIGestureRecognizer *gr in _cancelGestureRecognizers) {
    [_svcv.scrollView removeGestureRecognizer:gr];
  }
}

- (void)addCancelGestureRecognizers
{
  if (!_svcv) return;
  for (UIGestureRecognizer *gr in _cancelGestureRecognizers) {
    [_svcv.scrollView addGestureRecognizer:gr];
  }
}

- (void)enableCancelGestureRecognizers
{
  for (UIGestureRecognizer *gr in _cancelGestureRecognizers) {
    [gr setEnabled:true];
  }
}

- (void)disableCancelGestureRecognizers
{
  for (UIGestureRecognizer *gr in _cancelGestureRecognizers) {
    [gr setEnabled:false];
  }
}

- (void)scrollToOffset:(CGPoint)offset animated:(bool)animated
{
  if (!_svcv) return;
  [_svcv scrollToOffset:offset animated:animated];
}

- (void)stopAnimation
{
  [self disableCancelGestureRecognizers];
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)handlePan:(UIPanGestureRecognizer *)gesture {
  if (!_svcv) return;
  
  UIScrollView *sv = _svcv.scrollView;
  
  CGPoint translation = [gesture translationInView:self];
  
  if (gesture.state == UIGestureRecognizerStateBegan) {
    _didImpact = false;
    
    if (sv.contentOffset.y < 0) {
      CGPoint newOffset = CGPointMake(sv.contentOffset.x, 0);
      sv.contentOffset = newOffset;
    }
    
    _initialOffset = sv.contentOffset;
  }
  
  if (gesture.state == UIGestureRecognizerStateChanged) {
    CGPoint newOffset = CGPointMake(sv.contentOffset.x, [self dampenOffset:(-translation.y + _initialOffset.y)]);
    sv.contentOffset = newOffset;
    
    if (sv.contentOffset.y <= -kPullThreshold && !_didImpact) {
      UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
      [generator impactOccurred];
      _didImpact = true;
    }
  }
  
  if (gesture.state == UIGestureRecognizerStateEnded) {
    CGPoint velocity = [gesture velocityInView:self];

    if (sv.contentOffset.y <= -kPullThreshold) {
      [self refresh];
      return;
    }
    
    if (sv.contentOffset.y < 0) {
      CGPoint newOffset = CGPointMake(sv.contentOffset.x, 0);
      [self scrollToOffset:newOffset animated:true];
      return;
    }
    
    if (abs(velocity.y) < 250 && sv.contentOffset.y >= 0) {
      return;
    }
    
    [self startDecayWithInitialTranslation:translation.y velocity:velocity.y];
  }
}

- (CGFloat)dampenOffset:(CGFloat)offset
{
  if (offset < 0) {
    return offset - (offset * kDampingFactor);
  }
  return offset;
}

- (void)handleTap:(UITapGestureRecognizer *)gesture {
  [self stopAnimation];
}

- (void)handleLongPress:(UILongPressGestureRecognizer *)gesture {
  [self stopAnimation];
}

- (void)startDecayWithInitialTranslation:(CGFloat)translation velocity:(CGFloat)startVelocity
{
  if (!_svcv) return;
  
  startVelocity = MAX(-kMaxVelocity, MIN(kMaxVelocity, startVelocity));
  _currentVelocity = startVelocity;
  _accumulatedTranslation = -translation;
  
  [self enableCancelGestureRecognizers];
  
  [_displayLink invalidate];
  
  CADisplayLink *link = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleDecayStep:)];
  
  link.preferredFramesPerSecond = 60;
  [link addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  _displayLink = link;
}

- (void)handleDecayStep:(CADisplayLink *)link
{
  _currentVelocity *= kVelocityDecay;
  
  CGFloat delta = -_currentVelocity / link.preferredFramesPerSecond;
  _accumulatedTranslation += delta;
  
  CGFloat rawY = _accumulatedTranslation + _initialOffset.y;
  CGFloat nextY = rawY > 0 ? rawY : 0;
  
  CGPoint newOffset = CGPointMake(
    _svcv.scrollView.contentOffset.x,
    nextY
  );
  _svcv.scrollView.contentOffset = newOffset;
  
  if (fabs(_currentVelocity) < kMinimumVelocity || nextY <= 0) {
    [link invalidate];
    _displayLink = nil;
    [self disableCancelGestureRecognizers];
  }
}

/*
 * We use this component on profile pages. The screne consists of a header component, a scrollview with buttons to
 * switch between profile tabs, and a pager view (RNCPagerViewComponentView). Both the header and the tab bar are
 * inside the same RCTViewComponentView. The view heirarchy looks something like this:
 * - RCTViewComponentView
 * -- RNCPagerViewComponentView
 * ----- (Many views deep) RCTScrollViewComponentView
 * ------ RCTEnhancedScrollView
 * -- RCTViewComponentView
 * --- RCTViewComponentView
 * ---- ScrollForwarderView
 * --- RCTScrollViewComponentView
 * ---- RCTEnhancedScrollView
 *
 * We want to find that RCTScrollViewComponentView inside of the RNCPagerViewComponentView. To achieve this, we can
 * use self.superview.superview.superview to get to the root RCTViewComponentView, find the RNCPagerViewComponentView,
 * then iterate through that view's subviews until we find a RCTScrollViewComponentView.
 *
 * This isn't great, because if we reorder the React components, we'll need to update this logic. There's probably
 * an easier way to achieve this, similar to how we used to do it in Paper (ie, get the scroll view's tag and find that),
 * but this also comes with some benefits, eg being able to reduce a lot of the logic in the JS code and just find the
 * scrollview when subviews change.
 */
- (void)tryFindScrollView
{
  [self removeCancelGestureRecognizers];
  
  // The root RCTViewComponentView
  UIView *rootView = self.superview.superview.superview;
  UIView *pagerView;
  
  NSString *targetClsName = @"RNCPagerViewComponentView";
  Class targetCls = NSClassFromString(targetClsName);

  for (UIView *subview in rootView.subviews) {
    if ([subview isKindOfClass:targetCls]) {
      pagerView = subview;
      break;
    }
  }
  
  if (!pagerView) return;
  
  RCTScrollViewComponentView *svcv = [self findRTCScrollViewComponentViewInView:pagerView];
  
  if (!svcv) return;
  
  _svcv = svcv;
  [self addCancelGestureRecognizers];
}

- (RCTScrollViewComponentView *)findRTCScrollViewComponentViewInView:(UIView *)view
{
  for (UIView *subview in view.subviews) {
    if ([subview isKindOfClass:[RCTScrollViewComponentView class]]) {
      RCTScrollViewComponentView *svcv = (RCTScrollViewComponentView *) subview;
      return svcv;
    }
    
    RCTScrollViewComponentView *svcv = [self findRTCScrollViewComponentViewInView:subview];
    if (svcv) return svcv;
  }
  return nil;
}

- (UIRefreshControl *)refreshContorl
{
  if (!_svcv) return nil;
  return _svcv.scrollView.refreshControl;
}

- (void)refresh
{
  __weak ScrollForwarderView *weakSelf = self;
  
  [_svcv.scrollView.refreshControl beginRefreshing];
  
  [UIView animateWithDuration:0.3
    delay:0
    options:UIViewAnimationOptionBeginFromCurrentState
    animations:^(void) {
      if (!weakSelf) return;
    
      __strong ScrollForwarderView *self = weakSelf;
    
      // Whenever we call this method, the scrollview will always be at a position of
      // -130 or less. Scrolling back to -80 simulates the default behavior of RCTRefreshControl
      [self->_svcv.scrollView setContentOffset:CGPointMake(0, -65)];
    }
    completion:^(__unused BOOL finished) {
      __strong ScrollForwarderView *self = weakSelf;

      if (self->_eventEmitter != nullptr) {
        std::dynamic_pointer_cast<const facebook::react::ScrollForwarderViewEventEmitter>(self->_eventEmitter)
        ->onRefresh(facebook::react::ScrollForwarderViewEventEmitter::OnRefresh{});
      }
    }
  ];
}

- (void)endRefreshing
{
  UIRefreshControl *rc = [self refreshContorl];
  
  CGPoint newOffset = CGPointMake(_svcv.scrollView.contentOffset.x, 0.0);
  [self scrollToOffset:newOffset animated:true];
  
  [rc endRefreshing];
}

Class<RCTComponentViewProtocol> ScrollForwarderViewCls(void)
{
  return ScrollForwarderView.class;
}

@end
