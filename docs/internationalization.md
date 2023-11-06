# Internationalization

We want the official Bluesky app to be supported in as many languages as possible. If you want to help us translate the app, please reach out to us at info@blueskyweb.xyz

## Tools
We are using Lingui to manage translations. You can find the documentation [here](https://lingui.dev/).

### Adding new strings
When adding a new string, do it as follows:
```jsx
// Before
import { Text } from "react-native";
<Text> Hello World </Text>
```

```jsx
// After
import { Text } from "react-native";
import { Trans } from "@lingui/macro";
<Text><Trans> Hello World </Trans></Text>
```

We can then run `yarn intl:extract` to update the catalog in `src/locale/locales/{locale}/messages.po`. This will add the new string to the catalog.
We can then run `yarn intl:compile` to update the translation files in `src/locale/locales/{locale}/messages.js`. This will add the new string to the translation files. 
The configuration for translations is defined in `lingui.config.js`

