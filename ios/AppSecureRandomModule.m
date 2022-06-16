#import "AppSecureRandomModule.h"

@implementation AppSecureRandomModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

RCT_REMAP_METHOD(generateSecureRandomAsBase64,
                 withLength:(int)length
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableData* bytes = [NSMutableData dataWithLength:length];
  int result = SecRandomCopyBytes(kSecRandomDefault,length, [bytes mutableBytes]);
  if (result == errSecSuccess) {
    resolve([bytes base64EncodedStringWithOptions:0]);
  } else {
    NSError *error = [NSError errorWithDomain:@"RNSecureRandom" code:result userInfo: nil];
    reject(@"randombytes_error", @"Error generating random bytes", error);
  }
}

@end
