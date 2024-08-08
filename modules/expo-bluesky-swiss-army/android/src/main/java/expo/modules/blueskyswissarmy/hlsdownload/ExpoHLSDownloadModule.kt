package expo.modules.blueskyswissarmy.platforminfo

import android.provider.Settings
import expo.modules.blueskyswissarmy.hlsdownload.HLSDownloadView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URI

class ExpoHLSDownloadModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoHLSDownload")

      View(HLSDownloadView::class) {
        Events(
          arrayOf(
          "onStart",
          "onError",
          "onProgress",
          "onSuccess"
        )
        )

        Prop("downloaderUrl") { view: HLSDownloadView, downloaderUrl: URI ->

        }

        AsyncFunction("startDownloadAsync") {
          
        }
      }
    }
}
