import ExpoModulesCore
import SafariServices

public class UrlPrewarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("UrlPrewarm")

    AsyncFunction("prewarmUrlsAsync") { (urls: [String]) in
      let validUrls = urls.compactMap { URL(string: $0) }
      SFSafariViewController.prewarmConnections(to: validUrls)
    }
  }
}
