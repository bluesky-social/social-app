import ExpoModulesCore

public class ExpoHLSDownloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHLSDownload")

    Function("isAvailable") {
      if #available(iOS 14.5, *) {
        return true
      }
      return false
    }

    View(HLSDownloadView.self) {
      Events([
        "onStart",
        "onError",
        "onProgress",
        "onSuccess"
      ])

      Prop("downloaderUrl") { (view: HLSDownloadView, downloaderUrl: URL) in
        view.downloaderUrl = downloaderUrl
      }

      AsyncFunction("startDownloadAsync") { (view: HLSDownloadView, sourceUrl: URL) in
        view.startDownload(sourceUrl: sourceUrl)
      }
    }
  }
}
