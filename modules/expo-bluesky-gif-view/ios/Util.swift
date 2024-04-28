import SDWebImage

class Util {
  static func createContext() -> SDWebImageContext {
    var context = SDWebImageContext()

    // SDAnimatedImage for some reason has issues whenever loaded from memory. Instead, we
    // will just use the disk. SDWebImage will manage this cache for us, so we don't need
    // to worry about clearing it.
    context[.originalQueryCacheType] = SDImageCacheType.disk.rawValue
    context[.originalStoreCacheType] = SDImageCacheType.disk.rawValue
    context[.queryCacheType] = SDImageCacheType.disk.rawValue
    context[.storeCacheType] = SDImageCacheType.disk.rawValue

    return context
  }
}
