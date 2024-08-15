package expo.modules.blueskyswissarmy.hlsdownload

import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoHLSDownloadModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoHLSDownload")

      Function("isAvailable") {
        return@Function true
      }

      View(HLSDownloadView::class) {
        Events(
          arrayOf(
            "onStart",
            "onError",
            "onProgress",
            "onSuccess",
          ),
        )

        Prop("downloaderUrl") { view: HLSDownloadView, downloaderUrl: Uri ->
          view.downloaderUrl = downloaderUrl
        }

        AsyncFunction("startDownloadAsync") { view: HLSDownloadView, sourceUrl: Uri ->
          view.startDownload(sourceUrl)
        }
      }
    }
}
