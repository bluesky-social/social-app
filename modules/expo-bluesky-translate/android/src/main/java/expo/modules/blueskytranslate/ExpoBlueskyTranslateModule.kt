package expo.modules.blueskytranslate

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoBlueskyTranslateModule : Module() {
    var translationPromise: Promise? = null

    override fun definition() = ModuleDefinition {
        Name("ExpoBlueskyTranslate")

        AsyncFunction("translateAsync") { sourceLanguage: String, targetLanguage: String, text: String, promise: Promise ->
            if (translationPromise != null) {
                promise.reject(TranslationInProgressException())
                return@AsyncFunction
            }

            translationPromise = promise

            val options = TranslatorOptions.Builder()
                .setSourceLanguage(sourceLanguage)
                .setTargetLanguage(targetLanguage)
                .build()

            val translator = Translation.getClient(options)

            val conditions = DownloadConditions.Builder()
                .requireWifi()
                .build()


            translator.downloadModelIfNeeded(conditions)
                .addOnSuccessListener {
                    translator.translate(encodeSpecialCharacters(text))
                        .addOnSuccessListener { translatedText ->
                            promise.resolve(decodeSpecialCharacters(translatedText))
                            translationPromise = null
                        }
                        .addOnFailureListener { exception ->
                            promise.reject(UnableToTranslateTextException())
                            translationPromise = null
                        }
                }
                .addOnFailureListener { exception ->
                    promise.reject(UnableToTranslateTextException())
                    translationPromise = null
                }

        }
    }

  private fun encodeSpecialCharacters(text: String): String {
    return text.replace("\n", "␤")  // Use Unicode character for newline
      .replace("\t", "␉")  // Use Unicode character for tab
  }

  private fun decodeSpecialCharacters(text: String): String {
    return text.replace("␤", "\n")
      .replace("␉", "\t")
  }
}
