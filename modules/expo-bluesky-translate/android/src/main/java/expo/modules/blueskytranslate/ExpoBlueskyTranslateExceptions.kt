package expo.modules.blueskytranslate
import expo.modules.kotlin.exception.CodedException

internal class UnableToTranslateTextException :
    CodedException("Unable to translate text")


internal class TranslationInProgressException :
    CodedException("A translation is already in progress. Please await other translation first.")