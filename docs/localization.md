# Internationalization

We want the official Bluesky app to be supported in as many languages as possible. If you want to help us translate the app, please open a PR or issue on the [Bluesky app repo on GitHub](https://github.com/bluesky-social/social-app)

## Tools

- We use Lingui to implement translations. You can find the documentation [here](https://lingui.dev/).
- We use Crowdin to manage translations.
  - Bluesky Crowdin: https://crowdin.com/project/bluesky-social
  - Introduction to Crowdin: https://support.crowdin.com/for-translators/

## Translators

Much of the app is translated by community contributions. (We <3 our translators!) If you want to participate in the translation of the app, read this section.

### Using Crowdin

[Crowdin](https://crowdin.com/project/bluesky-social) is our primary tool for managing translations. There are two roles:

- **Proof-readers**. Can create new translations and approve submitted translations.
- **Translators**. Can create new translations.

All translations must be approved by proof-readers before they are accepted into the app.

### Using other platforms

You may contribute PRs separately from Crowdin, however we strongly recommend using Crowdin to avoid conflicts.

### Code of conduct on Crowdin

Please treat everyone with respect. Proof-readers are given final say on translations. Translators who frequently come into conflict with other translators, or who contribute noticably incorrect translations, will have their membership to the Crowdin project revoked.

### Adding a new language

Create a new [Crowdin discussion](https://crowdin.com/project/bluesky-social/discussions) or [GitHub issue](https://github.com/bluesky-social/social-app/issues) requesting the new language be added to the project.

Please only request a new language when you are certain you will be able to contribute a substantive portion of translations for the language.

## Maintainers

Install the [Crowdin CLI](https://crowdin.github.io/crowdin-cli/). You will need to [configure your API token](https://crowdin.github.io/crowdin-cli/configuration) to access the project.

### English source-file sync with Crowdin

Every night, a GitHub action will run `yarn intl:extract` to update the english `messages.po` file. This will be automatically synced with Crowdin. Crowdin should notify all subscribed users of new translations.

### Release process

1. Pull main and create a branch.
1. Run `yarn intl:pull` to fetch all translation updates from Crowdin.
1. Create a PR, ensure the translations all look correct, and merge.
1. If needed:
  1. Merge all approved translation PRs (contributions from outside crowdin).
  1. Run `yarn intl:push` to sync Crowdin with the state of the repo.

### Testing the translations in Crowdin

You can run `yarn intl:pull` to pull the currently-approved translations from Crowdin.

## Developers

### Adding new strings

When adding a new string, do it as follows:
```jsx
// Before
import { Text } from "react-native";

<Text>Hello World</Text>
```

```jsx
// After
import { Text } from "react-native";
import { Trans } from "@lingui/macro";

<Text><Trans>Hello World</Trans></Text>
```

The `<Trans>` macro will extract the string and add it to the catalog. It is not really a component, but a macro. Further reading [here](https://lingui.dev/ref/macro.html)

However sometimes you will run into this case:
```jsx
// Before
import { Text } from "react-native";

const text = "Hello World";
<Text accessibilityLabel="Label is here">{text}</Text>
```
In this case, you can use the `useLingui()` hook:
```jsx
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";

const { _ } = useLingui();
return <Text accessibilityLabel={_(msg`Label is here`)}>{text}</Text>
```

If you want to do this outside of a React component, you can use the `t` macro instead (note: this won't react to changes if the locale is switched dynamically within the app):
```jsx
import { t } from "@lingui/macro";

const text = t`Hello World`;
```

We can then run `yarn intl:extract` to update the catalog in `src/locale/locales/{locale}/messages.po`. This will add the new string to the catalog.
We can then run `yarn intl:compile` to update the translation files in `src/locale/locales/{locale}/messages.js`. This will add the new string to the translation files. 
The configuration for translations is defined in `lingui.config.js`

So the workflow is as follows:
1. Wrap messages in Trans macro
2. Run `yarn intl:extract` command to generate message catalogs
3. Translate message catalogs (send them to translators usually)
4. Run `yarn intl:compile` to create runtime catalogs
5. Load runtime catalog
6. Enjoy translated app!

### Common pitfalls

These pitfalls are memoization pitfalls that will cause the components to not re-render when the locale is changed -- causing stale translations to be shown.

```jsx
import { msg } from "@lingui/macro";
import { i18n } from "@lingui/core";

const welcomeMessage = msg`Welcome!`;

// ❌ Bad! This code won't work
export function Welcome() {
  const buggyWelcome = useMemo(() => {
    return i18n._(welcomeMessage);
  }, []);

  return <div>{buggyWelcome}</div>;
}

// ❌ Bad! This code won't work either because the reference to i18n does not change
export function Welcome() {
  const { i18n } = useLingui();

  const buggyWelcome = useMemo(() => {
    return i18n._(welcomeMessage);
  }, [i18n]);

  return <div>{buggyWelcome}</div>;
}

// ✅ Good! `useMemo` has i18n context in the dependency
export function Welcome() {
  const linguiCtx = useLingui();

  const welcome = useMemo(() => {
    return linguiCtx.i18n._(welcomeMessage);
  }, [linguiCtx]);

  return <div>{welcome}</div>;
}

// 🤩 Better! `useMemo` consumes the `_` function from the Lingui context
export function Welcome() {
  const { _ } = useLingui();

  const welcome = useMemo(() => {
    return _(welcomeMessage);
  }, [_]);

  return <div>{welcome}</div>;
}
```
