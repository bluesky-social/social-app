import ExpoModulesCore
import JOSESwift

struct JWTVerifyResponse : Record {
  @Field
  var payload: String?
  @Field
  var protectedHeader: String?
}
