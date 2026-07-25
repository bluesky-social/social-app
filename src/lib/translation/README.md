# Translation

A hook for translating text on-device for inline display.

## Translating text

```tsx
const langPrefs = useLanguagePrefs()
const {translate} = useTranslate({key: post.uri})

// ...

void translate({
  text: record.text,
  targetLangCode: langPrefs.primaryLanguage,
})
```

## Clearing/hiding a translation

```tsx
const {clearTranslation} = useTranslate({key: post.uri})

// ...

clearTranslation()
```

## Rendering a translation

```tsx
const {translationState} = useTranslate({key: post.uri})

// ...

switch (translationState.status) {
  case 'idle':
    // Default state; render a link that calls `translate`.
    break;
  case 'loading':
    // On-device translation is in progress; render a loading spinner.
    break;
  case 'success':
    // Translation complete; render `translationState.translatedText` and a link
    // that calls `clearTranslation`.
    break;
  case 'error':
    // On-device translation failed; render `translationState.message` and a
    // link to `translate` from `useGoogleTranslate` as a fallback.
    break;
}
```

## Notes

* Android only supports two-letter language codes.
   * For example, this means it doesn’t differentiate between `pt-BR` and `pt-PT`.
* Android and iOS only support a subset of the language options we offer (iOS supports fewer than Android).
* Individual language packs must be downloaded on iOS.
