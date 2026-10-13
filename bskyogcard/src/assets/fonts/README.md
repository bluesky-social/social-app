# Font licensing

This directory contains Inter subsets tracked in the repository and Noto Sans fonts downloaded during the OG card build. Both are separately licensed under the SIL Open Font License, Version 1.1, rather than Bluesky's [MIT license](../../../../LICENSE).

## Inter

```
Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter)
```

The tracked `Inter-Bold.ttf`, `Inter-Regular.ttf`, and `Inter-SemiBold.ttf` files are subsets of [Inter](https://rsms.me/inter/) by Rasmus Andersson. The full license text is at [`assets/fonts/inter/OFL.txt`](../../../../assets/fonts/inter/OFL.txt). The bundled OFL does not designate a Reserved Font Name.

## Noto Sans

[`bskyogcard/scripts/install-fonts.ts`](../../../scripts/install-fonts.ts) downloads Noto Sans Arabic, Hebrew, HK, JP, KR, SC, TC, and Thai into this directory. The build copies them into `bskyogcard/dist/assets/fonts/`, and the Docker image contains both locations.

```
(c) 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'.
Copyright 2015-2020 Google LLC. All Rights Reserved.
Copyright 2024 The Noto Project Authors (https://github.com/notofonts/hebrew)
Copyright 2022 The Noto Project Authors (https://github.com/notofonts/thai)
```

Their full license text is in [`OFL-NOTO.txt`](./OFL-NOTO.txt). The CJK families reserve the name "Source."

**You may redistribute these fonts under their respective OFL notices. Keep the applicable copyright notice and OFL text with every redistributed copy.**
