export type ExpoBlueskyTranslateModule = {
  /**
   * Translates the given text to the target language and presents it to the user.
   * @param text Text to translate
   */
  presentAsync: (text: string) => Promise<void>
  /**
   * Translates the given text to the target language.
   * @param sourceLanguage Source language code (IETF BCP-47 language tag)
   * @param targetLanguage Target language code (IETF BCP-47 language tag)
   * @param text Text to translate
   * @returns Translated text
   */
  translateAsync: (
    sourceLanguage: string,
    targetLanguage: string,
    text: string,
  ) => Promise<string>
}
